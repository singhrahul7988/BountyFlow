import { NextResponse } from "next/server";

import {
  buildDecisionFromAdminSubmission,
  buildPersistedSubmissionPayload,
  normalizeStoredSubmission
} from "@/lib/demo-persistence";
import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import { createOwnerNotification } from "@/lib/onchain/service";
import { requireApiRole } from "@/lib/server/authorization";
import { hasSupabaseEnv } from "@/lib/supabase/config";

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

  const auth = await requireApiRole({
    route: "/api/submissions",
    roles: ["researcher"]
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

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

  if (matchingBounty?.owner_id && adminSubmission.aiScore >= 5) {
    try {
      await createOwnerNotification(supabase, {
        ownerId: matchingBounty.owner_id,
        type: adminSubmission.aiScore >= 9 ? "CRITICAL" : "SUBMISSION",
        title: `${adminSubmission.title} entered the owner queue`,
        description:
          "A new researcher submission passed the triage threshold and is ready for owner review.",
        actionLabel: "REVIEW NOW ->",
        actionHref: `/admin/submissions/${adminSubmission.id}`
      });
    } catch {
      // Submission persistence should remain usable even if notification tables are not ready.
    }
  }

  return NextResponse.json(item);
}
