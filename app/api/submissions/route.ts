import { NextResponse } from "next/server";

import { getRoleFromProfile } from "@/lib/auth";
import {
  buildDecisionFromAdminSubmission,
  buildPersistedSubmissionPayload,
  normalizeStoredSubmission
} from "@/lib/demo-persistence";
import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getProfileByUserId } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    adminSubmission?: AdminSubmission;
    researcherSubmission?: ResearcherSubmission;
  } | null;

  const adminSubmission = body?.adminSubmission;
  const researcherSubmission = body?.researcherSubmission;

  if (!adminSubmission || !researcherSubmission) {
    return NextResponse.json({ error: "Submission payload is required." }, { status: 400 });
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

  if (role !== "researcher") {
    return NextResponse.json({ error: "Researcher access required." }, { status: 403 });
  }

  const { data: matchingBounty } = await supabase
    .from("demo_bounties")
    .select("owner_id")
    .eq("slug", researcherSubmission.bountySlug)
    .maybeSingle();

  const payload = buildPersistedSubmissionPayload(
    adminSubmission,
    researcherSubmission,
    buildDecisionFromAdminSubmission(adminSubmission)
  );

  const { data, error } = await supabase
    .from("demo_submissions")
    .upsert(
      {
        admin_id: adminSubmission.id,
        researcher_submission_id: researcherSubmission.id,
        owner_id: matchingBounty?.owner_id ?? null,
        researcher_user_id: user.id,
        bounty_slug: researcherSubmission.bountySlug,
        bounty_name: researcherSubmission.bountyName,
        title: researcherSubmission.title,
        status: adminSubmission.status,
        payload
      },
      { onConflict: "admin_id" }
    )
    .select("admin_id, researcher_submission_id, payload")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const item = normalizeStoredSubmission(data);

  if (!item) {
    return NextResponse.json(
      { error: "Failed to normalize stored submission." },
      { status: 500 }
    );
  }

  return NextResponse.json(item);
}
