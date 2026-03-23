import { NextResponse } from "next/server";

import type { AdminSubmissionStatus } from "@/lib/admin-submissions-data";
import { applySubmissionDecisionToResearcher } from "@/lib/demo-lifecycle";
import { normalizeStoredSubmission } from "@/lib/demo-persistence";
import { handleServerError } from "@/lib/server/api-errors";
import {
  rejectMissingOwnedResource,
  requireApiRole
} from "@/lib/server/authorization";
import { validateSubmissionDecision } from "@/lib/server/demo-payload-validation";
import {
  parseJsonObjectBody,
  validateIdentifier
} from "@/lib/server/request-validation";
import { hasSupabaseEnv } from "@/lib/supabase/config";

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

  const submissionId = validateIdentifier(params.id, "id", {
    maxLength: 40,
    pattern: /^BF-[A-Z0-9-]+$/
  });

  if (!submissionId.ok) {
    return submissionId.response;
  }

  const parsedBody = await parseJsonObjectBody(request, [
    "status",
    "payoutPct",
    "rejectionReason",
    "disputeNote",
    "txHash"
  ]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const body = validateSubmissionDecision(parsedBody.value);

  if (!body.ok) {
    return body.response;
  }

  const auth = await requireApiRole({
    route: "/api/submissions/[id]",
    roles: ["owner"],
    requireAllowedOwnerEmail: true
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

  const { data: existingRow, error: loadError } = await supabase
    .from("demo_submissions")
    .select("admin_id, researcher_submission_id, payload, owner_id")
    .eq("admin_id", submissionId.value)
    .maybeSingle();

  if (loadError) {
    return handleServerError(loadError, { route: "/api/submissions/[id]" }, "Unable to update submission.");
  }

  if (!existingRow) {
    return rejectMissingOwnedResource({
      route: "/api/submissions/[id]",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "submission",
      resourceId: submissionId.value,
      message: "Submission not found."
    });
  }

  const normalized = normalizeStoredSubmission(existingRow);

  if (!normalized) {
    return NextResponse.json({ error: "Stored submission payload is invalid." }, { status: 500 });
  }

  const nextAdminSubmission = {
    ...normalized.adminSubmission,
    status: body.value.status,
    recommendedPct: body.value.payoutPct,
    disputeNote: body.value.disputeNote ?? normalized.adminSubmission.disputeNote
  };
  const nextResearcherSubmission = applySubmissionDecisionToResearcher(
    normalized.researcherSubmission,
    { [nextAdminSubmission.id]: body.value }
  );

  const nextPayload = {
    adminSubmission: nextAdminSubmission,
    researcherSubmission: nextResearcherSubmission,
    decision: body.value
  };

  const { data, error } = await supabase
    .from("demo_submissions")
    .update({
      status: body.value.status,
      payload: nextPayload
    })
    .eq("admin_id", submissionId.value)
    .select("admin_id, researcher_submission_id, payload")
    .single();

  if (error) {
    return handleServerError(error, { route: "/api/submissions/[id]" }, "Unable to update submission.");
  }

  const item = normalizeStoredSubmission(data);

  if (!item) {
    return NextResponse.json({ error: "Failed to normalize updated submission." }, { status: 500 });
  }

  return NextResponse.json(item);
}
