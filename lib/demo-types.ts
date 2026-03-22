import type { AdminSubmission, AdminSubmissionStatus } from "@/lib/admin-submissions-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";

export type SubmissionDisputeNote = {
  reason: string;
  desiredPct: number;
  approvedPct: number;
  justification?: string;
  openedAt?: string;
  expiresAt?: string;
  resolution?: "ACCEPT_CLAIM" | "HOLD_ORIGINAL" | "AUTO_CLOSED";
};

export type SubmissionDecision = {
  status: AdminSubmissionStatus;
  payoutPct: number;
  rejectionReason?: string;
  disputeNote?: SubmissionDisputeNote;
  txHash?: string;
};

export type PersistedSubmissionPayload = {
  adminSubmission: AdminSubmission;
  researcherSubmission: ResearcherSubmission;
  decision: SubmissionDecision;
};

export type PersistedBountyPayload = BountyDetail;
