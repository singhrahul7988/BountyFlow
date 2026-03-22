import {
  adminSubmissions,
  type AdminSubmissionStatus
} from "@/lib/admin-submissions-data";
import {
  type ResearcherSubmission,
  type ResearcherSubmissionStatus
} from "@/lib/dashboard-data";
import type { PayoutHistoryEntry } from "@/lib/dashboard-data";
import type { DashboardSummary } from "@/lib/dashboard-data";
import type { SubmissionDecision } from "@/lib/demo-types";

function mapAdminStatusToResearcherStatus(
  status: AdminSubmissionStatus
): ResearcherSubmissionStatus {
  if (status === "PAID") {
    return "PAID";
  }

  if (status === "DISPUTE OPEN") {
    return "DISPUTE OPEN";
  }

  if (status === "REJECTED") {
    return "REJECTED";
  }

  return status;
}

function getResearcherResponseEta(status: ResearcherSubmissionStatus) {
  if (status === "AI SCORING") {
    return "AI ANALYSIS RUNNING";
  }

  if (status === "AI SCORED" || status === "UNDER REVIEW") {
    return "ETA 12H";
  }

  if (status === "DISPUTE WINDOW") {
    return "48H DISPUTE WINDOW";
  }

  if (status === "DISPUTE OPEN") {
    return "OWNER RESOLUTION PENDING";
  }

  if (status === "REJECTED") {
    return "CLOSED";
  }

  return undefined;
}

export function getLinkedAdminSubmissionId(researcherSubmissionId: string) {
  const suffix = researcherSubmissionId.replace(/^sub-/, "");
  const adminId = `BF-${suffix}`;

  return adminSubmissions.some((submission) => submission.id === adminId) ? adminId : null;
}

export function applySubmissionDecisionToResearcher(
  submission: ResearcherSubmission,
  decisions: Record<string, SubmissionDecision>
) {
  const adminId = getLinkedAdminSubmissionId(submission.id);

  if (!adminId) {
    return submission;
  }

  const decision = decisions[adminId];
  const adminSubmission = adminSubmissions.find((item) => item.id === adminId);

  if (!decision || !adminSubmission) {
    return submission;
  }

  const mappedStatus = mapAdminStatusToResearcherStatus(decision.status);
  const payout =
    mappedStatus === "REJECTED"
      ? 0
      : Math.round((adminSubmission.tierReward * decision.payoutPct) / 100);

  return {
    ...submission,
    status: mappedStatus,
    payout,
    responseEta: getResearcherResponseEta(mappedStatus),
    txHash: decision.txHash ?? submission.txHash,
    dispute: decision.disputeNote ?? submission.dispute
  };
}

export function buildDashboardSummary(submissions: ResearcherSubmission[]): DashboardSummary {
  const totalEarned = submissions
    .filter((submission) => submission.status === "PAID")
    .reduce((total, submission) => total + submission.payout, 0);

  const active = submissions.filter((submission) =>
    ["DRAFT", "SUBMITTED", "AI SCORING"].includes(submission.status)
  ).length;

  const review = submissions.filter((submission) =>
    ["AI SCORED", "UNDER REVIEW", "DISPUTE WINDOW", "DISPUTE OPEN"].includes(submission.status)
  ).length;

  const rejected = submissions.filter((submission) => submission.status === "REJECTED").length;
  const resolved = submissions.filter((submission) =>
    ["PAID", "FIX IN PROGRESS", "REJECTED"].includes(submission.status)
  ).length;

  const scoredSubmissions = submissions.filter((submission) => submission.aiScore > 0);
  const averageAiScore =
    scoredSubmissions.reduce((total, submission) => total + submission.aiScore, 0) /
      (scoredSubmissions.length || 1);

  return {
    totalEarned,
    submissions: submissions.length,
    active,
    review,
    resolved,
    rejected,
    reputationScore: 8.6,
    reputationPercentile: "TOP 12% GLOBALLY",
    averageAiScore: Number(averageAiScore.toFixed(1)),
    averageAiScoreDelta: "+0.4 VS LAST MONTH"
  };
}

export function buildDynamicPayoutHistory(submissions: ResearcherSubmission[]): PayoutHistoryEntry[] {
  return submissions
    .filter((submission) => submission.status === "PAID" && submission.txHash)
    .map((submission) => ({
      id: `pay-${submission.id}`,
      occurredAt: submission.submittedAt,
      amount: submission.payout,
      bountyName: submission.bountyName,
      txHash: submission.txHash ?? "",
      isCritical: submission.severity === "CRITICAL"
    }));
}
