import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import type { PersistedBountyPayload, PersistedSubmissionPayload, SubmissionDecision } from "@/lib/demo-types";

type JsonSource<T> = T | string | null;

export type DemoBountyRow = {
  slug: string;
  payload: JsonSource<PersistedBountyPayload>;
};

export type DemoSubmissionRow = {
  admin_id: string;
  researcher_submission_id: string;
  payload: JsonSource<PersistedSubmissionPayload>;
};

function parseJsonSource<T>(value: JsonSource<T>) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  return value;
}

export function buildDecisionFromAdminSubmission(submission: AdminSubmission): SubmissionDecision {
  return {
    status: submission.status,
    payoutPct: submission.recommendedPct
  };
}

export function buildPersistedSubmissionPayload(
  adminSubmission: AdminSubmission,
  researcherSubmission: ResearcherSubmission,
  decision: SubmissionDecision = buildDecisionFromAdminSubmission(adminSubmission)
): PersistedSubmissionPayload {
  return {
    adminSubmission,
    researcherSubmission,
    decision
  };
}

export function normalizeStoredBounty(row: DemoBountyRow): BountyDetail | null {
  const payload = parseJsonSource<PersistedBountyPayload>(row.payload);

  if (!payload || typeof payload !== "object" || !payload.slug) {
    return null;
  }

  return payload;
}

export function normalizeStoredSubmission(row: DemoSubmissionRow): PersistedSubmissionPayload | null {
  const payload = parseJsonSource<PersistedSubmissionPayload>(row.payload);

  if (
    !payload ||
    typeof payload !== "object" ||
    !payload.adminSubmission?.id ||
    !payload.researcherSubmission?.id
  ) {
    return null;
  }

  return payload;
}
