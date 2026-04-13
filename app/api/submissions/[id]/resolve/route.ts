import { NextResponse } from "next/server";

import { applySubmissionDecisionToResearcher } from "@/lib/demo-lifecycle";
import { normalizeStoredSubmission } from "@/lib/demo-persistence";
import {
  createOwnerNotification,
  getOnchainMode,
  insertTreasuryTransaction,
  performTreasuryTransfer
} from "@/lib/onchain/service";
import type { SubmissionDecision } from "@/lib/demo-types";
import { handleServerError } from "@/lib/server/api-errors";
import {
  rejectMissingOwnedResource,
  requireApiRole
} from "@/lib/server/authorization";
import {
  parseJsonObjectBody,
  readEnum,
  validateIdentifier
} from "@/lib/server/request-validation";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getProfileByUserId } from "@/lib/supabase/profiles";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;

  const submissionId = validateIdentifier(id, "id", {
    maxLength: 40,
    pattern: /^BF-[A-Z0-9-]+$/
  });

  if (!submissionId.ok) {
    return submissionId.response;
  }

  const parsedBody = await parseJsonObjectBody(request, ["resolution"]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const resolution = readEnum(parsedBody.value, "resolution", [
    "ACCEPT_CLAIM",
    "HOLD_ORIGINAL"
  ] as const);

  if (!resolution.ok) {
    return resolution.response;
  }

  const auth = await requireApiRole({
    route: "/api/submissions/[id]/resolve",
    roles: ["owner"],
    requireAllowedOwnerEmail: true
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

  let { data: row, error } = await supabase
    .from("demo_submissions")
    .select("admin_id, researcher_submission_id, payload, owner_id, researcher_user_id")
    .eq("admin_id", submissionId.value)
    .maybeSingle();

  if (error) {
    return handleServerError(error, { route: "/api/submissions/[id]/resolve" }, "Unable to resolve dispute.");
  }

  if (!row) {
    return rejectMissingOwnedResource({
      route: "/api/submissions/[id]/resolve",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "submission",
      resourceId: submissionId.value,
      message: "Submission not found."
    });
  }

  if (row.owner_id !== user.id) {
    return rejectMissingOwnedResource({
      route: "/api/submissions/[id]/resolve",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "submission",
      resourceId: submissionId.value,
      message: "Submission not found."
    });
  }

  const normalized = normalizeStoredSubmission(row);

  if (!normalized) {
    return NextResponse.json({ error: "Stored submission payload is invalid." }, { status: 500 });
  }

  if (normalized.decision.status !== "DISPUTE OPEN" || !normalized.decision.disputeNote) {
    return NextResponse.json({ error: "Only open disputes can be resolved." }, { status: 400 });
  }

  const finalPct =
    resolution.value === "ACCEPT_CLAIM"
      ? normalized.decision.disputeNote.desiredPct
      : normalized.decision.disputeNote.approvedPct;
  const payoutAmount = Math.round((normalized.adminSubmission.tierReward * finalPct) / 100);
  let payoutRecipient: string | undefined;

  if (getOnchainMode() === "live") {
    const { profile: researcherProfile, error: profileError } = await getProfileByUserId(
      supabase,
      row.researcher_user_id
    );

    if (profileError) {
      return handleServerError(profileError, { route: "/api/submissions/[id]/resolve" }, "Unable to resolve dispute.");
    }

    payoutRecipient = researcherProfile?.wallet_address || undefined;

    if (!payoutRecipient) {
      return NextResponse.json(
        {
          error:
            "The researcher has not linked a payout wallet yet. Link a wallet before releasing live settlement."
        },
        { status: 400 }
      );
    }
  }

  let tx;

  try {
    tx = await performTreasuryTransfer({
      ownerId: row.owner_id || user.id,
      bountySlug: normalized.researcherSubmission.bountySlug,
      amount: payoutAmount,
      type: "PAYOUT",
      description: `Resolved dispute for ${normalized.adminSubmission.id} and released payout.`,
      recipient: payoutRecipient
    });
  } catch (transferError) {
    return handleServerError(transferError, { route: "/api/submissions/[id]/resolve" }, "Unable to resolve dispute.");
  }

  const nextDecision: SubmissionDecision = {
    ...normalized.decision,
    status: "PAID",
    payoutPct: finalPct,
    txHash: tx.txHash,
    disputeNote: {
      ...normalized.decision.disputeNote,
      resolution: resolution.value
    }
  };
  const nextAdminSubmission = {
    ...normalized.adminSubmission,
    status: "PAID" as const,
    recommendedPct: finalPct,
    disputeNote: nextDecision.disputeNote
  };
  const nextResearcherSubmission = applySubmissionDecisionToResearcher(
    {
      ...normalized.researcherSubmission,
      dispute: nextDecision.disputeNote
    },
    { [normalized.adminSubmission.id]: nextDecision }
  );

  const nextPayload = {
    adminSubmission: nextAdminSubmission,
    researcherSubmission: nextResearcherSubmission,
    decision: nextDecision
  };

  const { data: updatedRow, error: updateError } = await supabase
    .from("demo_submissions")
    .update({
      status: "PAID",
      payload: nextPayload
    })
    .eq("admin_id", submissionId.value)
    .select("admin_id, researcher_submission_id, payload")
    .single();

  if (updateError) {
    return handleServerError(updateError, { route: "/api/submissions/[id]/resolve" }, "Unable to resolve dispute.");
  }

  try {
    await insertTreasuryTransaction(supabase, {
      ownerId: row.owner_id || user.id,
      bountySlug: normalized.researcherSubmission.bountySlug,
      amount: -payoutAmount,
      type: "PAYOUT",
      description:
        resolution.value === "ACCEPT_CLAIM"
          ? `Accepted dispute claim and released ${finalPct}% payout for ${normalized.adminSubmission.id}.`
          : `Held original payout and released ${finalPct}% for ${normalized.adminSubmission.id}.`,
      txHash: tx.txHash
    });

    await createOwnerNotification(supabase, {
      ownerId: row.owner_id || user.id,
      type: "PAYOUT",
      title: `Dispute resolved for ${normalized.adminSubmission.id}`,
      description:
        resolution.value === "ACCEPT_CLAIM"
          ? "Owner accepted the researcher claim and released the higher payout."
          : "Owner held the original percentage and released the approved payout.",
      actionLabel: "VIEW TREASURY ->",
      actionHref: "/admin/treasury"
    });
  } catch {
    // Submission resolution should remain usable even if optional ledger tables are not ready.
  }

  const item = normalizeStoredSubmission(updatedRow);

  if (!item) {
    return NextResponse.json({ error: "Failed to normalize resolved submission." }, { status: 500 });
  }

  return NextResponse.json(item);
}
