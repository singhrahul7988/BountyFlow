import { NextResponse } from "next/server";

import { getRoleFromProfile, isAllowedOwnerEmail } from "@/lib/auth";
import { getAdminSubmissionById } from "@/lib/admin-submissions-data";
import { applySubmissionDecisionToResearcher } from "@/lib/demo-lifecycle";
import {
  buildDecisionFromAdminSubmission,
  buildPersistedSubmissionPayload,
  normalizeStoredSubmission
} from "@/lib/demo-persistence";
import { getResearcherSubmissionById } from "@/lib/dashboard-data";
import {
  createOwnerNotification,
  getOnchainMode,
  insertTreasuryTransaction,
  performTreasuryTransfer
} from "@/lib/onchain/service";
import type { SubmissionDecision } from "@/lib/demo-types";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getProfileByUserId } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    resolution?: "ACCEPT_CLAIM" | "HOLD_ORIGINAL";
  } | null;

  if (!body?.resolution) {
    return NextResponse.json({ error: "Resolution choice is required." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { profile } = await getProfileByUserId(supabase, user.id);
  const role = getRoleFromProfile(profile);

  if (role !== "owner" || !isAllowedOwnerEmail(user.email || "")) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  let { data: row, error } = await supabase
    .from("demo_submissions")
    .select("admin_id, researcher_submission_id, payload, owner_id, researcher_user_id")
    .eq("admin_id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!row) {
    if (getOnchainMode() === "live") {
      return NextResponse.json(
        {
          error:
            "Live settlement requires a persisted researcher submission with a linked payout wallet. Seed-only review rows can be resolved only in mock mode."
        },
        { status: 400 }
      );
    }

    const seededAdmin = getAdminSubmissionById(params.id);
    const seededResearcher = getResearcherSubmissionById(
      `sub-${params.id.replace(/^BF-/, "")}`
    );

    if (!seededAdmin || !seededResearcher) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const payload = buildPersistedSubmissionPayload(
      seededAdmin,
      seededResearcher,
      buildDecisionFromAdminSubmission(seededAdmin)
    );

    const { data: insertedRow, error: insertError } = await supabase
      .from("demo_submissions")
      .upsert(
        {
          admin_id: seededAdmin.id,
          researcher_submission_id: seededResearcher.id,
          owner_id: user.id,
          researcher_user_id: user.id,
          bounty_slug: seededResearcher.bountySlug,
          bounty_name: seededResearcher.bountyName,
          title: seededResearcher.title,
          status: seededAdmin.status,
          payload
        },
        { onConflict: "admin_id" }
      )
      .select("admin_id, researcher_submission_id, payload, owner_id, researcher_user_id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    row = insertedRow;
  }

  if (row.owner_id && row.owner_id !== user.id) {
    return NextResponse.json({ error: "This submission belongs to a different owner." }, { status: 403 });
  }

  const normalized = normalizeStoredSubmission(row);

  if (!normalized) {
    return NextResponse.json({ error: "Stored submission payload is invalid." }, { status: 500 });
  }

  if (normalized.decision.status !== "DISPUTE OPEN" || !normalized.decision.disputeNote) {
    return NextResponse.json({ error: "Only open disputes can be resolved." }, { status: 400 });
  }

  const finalPct =
    body.resolution === "ACCEPT_CLAIM"
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
      return NextResponse.json({ error: profileError.message }, { status: 500 });
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

  const tx = await performTreasuryTransfer({
    ownerId: row.owner_id || user.id,
    bountySlug: normalized.researcherSubmission.bountySlug,
    amount: payoutAmount,
    type: "PAYOUT",
    description: `Resolved dispute for ${normalized.adminSubmission.id} and released payout.`,
    recipient: payoutRecipient
  });

  const nextDecision: SubmissionDecision = {
    ...normalized.decision,
    status: "PAID",
    payoutPct: finalPct,
    txHash: tx.txHash,
    disputeNote: {
      ...normalized.decision.disputeNote,
      resolution: body.resolution
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
    .eq("admin_id", params.id)
    .select("admin_id, researcher_submission_id, payload")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  try {
    await insertTreasuryTransaction(supabase, {
      ownerId: row.owner_id || user.id,
      bountySlug: normalized.researcherSubmission.bountySlug,
      amount: -payoutAmount,
      type: "PAYOUT",
      description:
        body.resolution === "ACCEPT_CLAIM"
          ? `Accepted dispute claim and released ${finalPct}% payout for ${normalized.adminSubmission.id}.`
          : `Held original payout and released ${finalPct}% for ${normalized.adminSubmission.id}.`,
      txHash: tx.txHash
    });

    await createOwnerNotification(supabase, {
      ownerId: row.owner_id || user.id,
      type: "PAYOUT",
      title: `Dispute resolved for ${normalized.adminSubmission.id}`,
      description:
        body.resolution === "ACCEPT_CLAIM"
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
