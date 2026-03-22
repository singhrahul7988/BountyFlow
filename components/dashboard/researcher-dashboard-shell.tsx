"use client";

import { useMemo } from "react";

import { researcherSubmissions } from "@/lib/dashboard-data";
import {
  buildDashboardSummary,
  buildDynamicPayoutHistory,
  applySubmissionDecisionToResearcher
} from "@/lib/demo-lifecycle";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { ResearcherDashboard } from "./researcher-dashboard";

export function ResearcherDashboardShell() {
  const submissionDecisions = useDemoDataStore((state) => state.submissionDecisions);

  const resolvedSubmissions = useMemo(
    () =>
      researcherSubmissions.map((submission) =>
        applySubmissionDecisionToResearcher(submission, submissionDecisions)
      ),
    [submissionDecisions]
  );

  const summary = useMemo(() => buildDashboardSummary(resolvedSubmissions), [resolvedSubmissions]);
  const payoutHistory = useMemo(
    () => buildDynamicPayoutHistory(resolvedSubmissions),
    [resolvedSubmissions]
  );

  return (
    <ResearcherDashboard
      submissions={resolvedSubmissions}
      summary={summary}
      payoutHistory={payoutHistory}
    />
  );
}
