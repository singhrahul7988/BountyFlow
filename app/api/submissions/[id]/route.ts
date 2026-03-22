import { NextResponse } from "next/server";

import { getRoleFromProfile, isAllowedOwnerEmail } from "@/lib/auth";
import type { AdminSubmissionStatus } from "@/lib/admin-submissions-data";
import { applySubmissionDecisionToResearcher } from "@/lib/demo-lifecycle";
import { normalizeStoredSubmission } from "@/lib/demo-persistence";
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

  const body = (await request.json().catch(() => null)) as SubmissionDecision | null;

  if (!body?.status) {
    return NextResponse.json({ error: "Decision payload is required." }, { status: 400 });
  }

  const allowedStatuses: AdminSubmissionStatus[] = [
    "AI SCORED",
    "UNDER REVIEW",
    "DISPUTE WINDOW",
    "DISPUTE OPEN",
    "FIX IN PROGRESS",
    "REJECTED"
  ];

  if (!allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Unsupported submission status." }, { status: 400 });
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

  const { data: existingRow, error: loadError } = await supabase
    .from("demo_submissions")
    .select("admin_id, researcher_submission_id, payload, owner_id")
    .eq("admin_id", params.id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }

  if (!existingRow) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  if (existingRow.owner_id && existingRow.owner_id !== user.id) {
    return NextResponse.json({ error: "This submission belongs to a different owner." }, { status: 403 });
  }

  const normalized = normalizeStoredSubmission(existingRow);

  if (!normalized) {
    return NextResponse.json({ error: "Stored submission payload is invalid." }, { status: 500 });
  }

  const nextAdminSubmission = {
    ...normalized.adminSubmission,
    status: body.status,
    recommendedPct: body.payoutPct
  };
  const nextResearcherSubmission = applySubmissionDecisionToResearcher(
    normalized.researcherSubmission,
    { [nextAdminSubmission.id]: body }
  );

  const nextPayload = {
    adminSubmission: nextAdminSubmission,
    researcherSubmission: nextResearcherSubmission,
    decision: body
  };

  const { data, error } = await supabase
    .from("demo_submissions")
    .update({
      status: body.status,
      payload: nextPayload
    })
    .eq("admin_id", params.id)
    .select("admin_id, researcher_submission_id, payload")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const item = normalizeStoredSubmission(data);

  if (!item) {
    return NextResponse.json({ error: "Failed to normalize updated submission." }, { status: 500 });
  }

  return NextResponse.json(item);
}
