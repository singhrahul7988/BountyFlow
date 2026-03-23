import { NextResponse } from "next/server";

import { formatUtcTimestamp, normalizeStoredSubmission } from "@/lib/demo-persistence";
import { createOwnerNotification } from "@/lib/onchain/service";
import type { SubmissionDisputeNote } from "@/lib/demo-types";
import { handleServerError } from "@/lib/server/api-errors";
import {
  rejectMissingOwnedResource,
  rejectUnauthorizedResourceAccess,
  requireApiRole
} from "@/lib/server/authorization";
import {
  parseJsonObjectBody,
  readOptionalString,
  readRequiredNumber,
  readRequiredString,
  validateIdentifier
} from "@/lib/server/request-validation";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const submissionId = validateIdentifier(params.id, "id", {
    maxLength: 40,
    pattern: /^sub-[a-z0-9-]+$/
  });

  if (!submissionId.ok) {
    return submissionId.response;
  }

  const parsedBody = await parseJsonObjectBody(request, ["reason", "desiredPct", "justification"]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const reason = readRequiredString(parsedBody.value, "reason", { maxLength: 500 });
  const desiredPct = readRequiredNumber(parsedBody.value, "desiredPct", {
    integer: true,
    min: 1,
    max: 100
  });
  const justification = readOptionalString(parsedBody.value, "justification", { maxLength: 1500 });

  if (!reason.ok) {
    return reason.response;
  }

  if (!desiredPct.ok) {
    return desiredPct.response;
  }

  if (!justification.ok) {
    return justification.response;
  }

  const auth = await requireApiRole({
    route: "/api/submissions/[id]/dispute",
    roles: ["researcher"]
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

  let { data: row, error } = await supabase
    .from("demo_submissions")
    .select("admin_id, researcher_submission_id, payload, researcher_user_id, owner_id")
    .eq("researcher_submission_id", submissionId.value)
    .maybeSingle();

  if (error) {
    return handleServerError(error, { route: "/api/submissions/[id]/dispute" }, "Unable to open dispute.");
  }

  if (!row) {
    return rejectMissingOwnedResource({
      route: "/api/submissions/[id]/dispute",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "submission",
      resourceId: submissionId.value,
      message: "Submission not found."
    });
  }

  if (row.researcher_user_id !== user.id) {
    return rejectUnauthorizedResourceAccess({
      route: "/api/submissions/[id]/dispute",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "submission",
      resourceId: submissionId.value,
      message: "This submission belongs to another researcher."
    });
  }

  const normalized = normalizeStoredSubmission(row);

  if (!normalized) {
    return NextResponse.json({ error: "Stored submission payload is invalid." }, { status: 500 });
  }

  if (normalized.decision.status !== "DISPUTE WINDOW") {
    return NextResponse.json(
      { error: "Disputes can only be opened while the submission is in the dispute window." },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const disputeNote: SubmissionDisputeNote = {
    reason: reason.value,
    desiredPct: desiredPct.value,
    approvedPct: normalized.decision.payoutPct,
    justification: justification.value,
    openedAt: formatUtcTimestamp(now.toISOString()),
    expiresAt: formatUtcTimestamp(expiresAt.toISOString())
  };

  const nextDecision = {
    ...normalized.decision,
    status: "DISPUTE OPEN" as const,
    disputeNote
  };
  const nextAdminSubmission = {
    ...normalized.adminSubmission,
    status: "DISPUTE OPEN" as const,
    disputeNote
  };
  const nextResearcherSubmission = {
    ...normalized.researcherSubmission,
    status: "DISPUTE OPEN" as const,
    responseEta: "OWNER RESOLUTION PENDING",
    dispute: disputeNote
  };

  const nextPayload = {
    adminSubmission: nextAdminSubmission,
    researcherSubmission: nextResearcherSubmission,
    decision: nextDecision
  };

  const { data: updatedRow, error: updateError } = await supabase
    .from("demo_submissions")
    .update({
      status: "DISPUTE OPEN",
      payload: nextPayload
    })
    .eq("researcher_submission_id", submissionId.value)
    .select("admin_id, researcher_submission_id, payload")
    .single();

  if (updateError) {
    return handleServerError(updateError, { route: "/api/submissions/[id]/dispute" }, "Unable to open dispute.");
  }

  if (row.owner_id) {
    try {
      await createOwnerNotification(supabase, {
        ownerId: row.owner_id,
        type: "DISPUTE",
        title: `Researcher opened dispute on ${normalized.adminSubmission.id}`,
        description: `Requested ${disputeNote.desiredPct}% with justification for a higher payout decision.`,
        actionLabel: "REVIEW DISPUTE ->",
        actionHref: `/admin/submissions/${normalized.adminSubmission.id}`
      });
    } catch {
      // The dispute itself should still persist if notification tables are not ready.
    }
  }

  const item = normalizeStoredSubmission(updatedRow);

  if (!item) {
    return NextResponse.json({ error: "Failed to normalize disputed submission." }, { status: 500 });
  }

  return NextResponse.json(item);
}
