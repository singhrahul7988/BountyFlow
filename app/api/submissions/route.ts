import { NextResponse } from "next/server";

import {
  buildDecisionFromAdminSubmission,
  buildPersistedSubmissionPayload,
  normalizeStoredSubmission
} from "@/lib/demo-persistence";
import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import { createOwnerNotification } from "@/lib/onchain/service";
import { handleServerError } from "@/lib/server/api-errors";
import { requireApiRole } from "@/lib/server/authorization";
import {
  validateAdminSubmission,
  validateResearcherSubmission
} from "@/lib/server/demo-payload-validation";
import {
  parseJsonObjectBody,
  readObject
} from "@/lib/server/request-validation";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const parsedBody = await parseJsonObjectBody(request, ["adminSubmission", "researcherSubmission"]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const auth = await requireApiRole({
    route: "/api/submissions",
    roles: ["researcher"]
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;
  const adminSubmissionObject = readObject(parsedBody.value, "adminSubmission", [
    "id",
    "bountySlug",
    "bountyName",
    "severity",
    "title",
    "reporterName",
    "reporterAddress",
    "reporterReputation",
    "submittedAt",
    "aiScore",
    "status",
    "recommendedPct",
    "tierReward",
    "summaryRisk",
    "subScores",
    "evidencePills",
    "description",
    "stepsToReproduce",
    "impactAssessment",
    "codeSnippet",
    "screenshots",
    "uploadedFiles",
    "github",
    "internalNote",
    "disputeNote"
  ]);
  const researcherSubmissionObject = readObject(parsedBody.value, "researcherSubmission", [
    "id",
    "bountySlug",
    "bountyName",
    "title",
    "submittedAt",
    "aiScore",
    "status",
    "payout",
    "severity",
    "responseEta",
    "txHash",
    "description",
    "stepsToReproduce",
    "impactAssessment",
    "evidence",
    "dispute"
  ]);

  if (!adminSubmissionObject.ok) {
    return adminSubmissionObject.response;
  }

  if (!researcherSubmissionObject.ok) {
    return researcherSubmissionObject.response;
  }

  const adminSubmission = validateAdminSubmission(adminSubmissionObject.value, { userId: user.id });
  const researcherSubmission = validateResearcherSubmission(researcherSubmissionObject.value, {
    userId: user.id
  });

  if (!adminSubmission.ok) {
    return adminSubmission.response;
  }

  if (!researcherSubmission.ok) {
    return researcherSubmission.response;
  }

  if (
    adminSubmission.value.id.replace(/^BF-/, "sub-").toLowerCase() !== researcherSubmission.value.id ||
    adminSubmission.value.bountySlug !== researcherSubmission.value.bountySlug ||
    adminSubmission.value.bountyName !== researcherSubmission.value.bountyName ||
    adminSubmission.value.title !== researcherSubmission.value.title
  ) {
    return NextResponse.json({ error: "Submission payload is inconsistent." }, { status: 400 });
  }

  const { data: matchingBounty, error: matchingBountyError } = await supabase
    .from("demo_bounties")
    .select("owner_id")
    .eq("slug", researcherSubmission.value.bountySlug)
    .maybeSingle();

  if (matchingBountyError) {
    return handleServerError(
      matchingBountyError,
      { route: "/api/submissions" },
      "Unable to save submission."
    );
  }

  const payload = buildPersistedSubmissionPayload(
    adminSubmission.value,
    researcherSubmission.value,
    buildDecisionFromAdminSubmission(adminSubmission.value)
  );

  const { data, error } = await supabase
    .from("demo_submissions")
    .upsert(
      {
        admin_id: adminSubmission.value.id,
        researcher_submission_id: researcherSubmission.value.id,
        owner_id: matchingBounty?.owner_id ?? null,
        researcher_user_id: user.id,
        bounty_slug: researcherSubmission.value.bountySlug,
        bounty_name: researcherSubmission.value.bountyName,
        title: researcherSubmission.value.title,
        status: adminSubmission.value.status,
        payload
      },
      { onConflict: "admin_id" }
    )
    .select("admin_id, researcher_submission_id, payload")
    .single();

  if (error) {
    return handleServerError(error, { route: "/api/submissions" }, "Unable to save submission.");
  }

  const item = normalizeStoredSubmission(data);

  if (!item) {
    return NextResponse.json(
      { error: "Failed to normalize stored submission." },
      { status: 500 }
    );
  }

  if (matchingBounty?.owner_id && adminSubmission.value.aiScore >= 5) {
    try {
      await createOwnerNotification(supabase, {
        ownerId: matchingBounty.owner_id,
        type: adminSubmission.value.aiScore >= 9 ? "CRITICAL" : "SUBMISSION",
        title: `${adminSubmission.value.title} entered the owner queue`,
        description:
          "A new researcher submission passed the triage threshold and is ready for owner review.",
        actionLabel: "REVIEW NOW ->",
        actionHref: `/admin/submissions/${adminSubmission.value.id}`
      });
    } catch {
      // Submission persistence should remain usable even if notification tables are not ready.
    }
  }

  return NextResponse.json(item);
}
