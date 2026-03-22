import type { AdminSubmission, AdminSubmissionStatus } from "@/lib/admin-submissions-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";

export type SubmissionDecision = {
  status: AdminSubmissionStatus;
  payoutPct: number;
  rejectionReason?: string;
};

export type PersistedSubmissionPayload = {
  adminSubmission: AdminSubmission;
  researcherSubmission: ResearcherSubmission;
  decision: SubmissionDecision;
};

export type PersistedBountyPayload = BountyDetail;
