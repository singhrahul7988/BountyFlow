"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

import { researcherSubmissions } from "@/lib/dashboard-data";
import {
  buildDashboardSummary,
  buildDynamicPayoutHistory,
  applySubmissionDecisionToResearcher
} from "@/lib/demo-lifecycle";
import { useAppStore } from "@/lib/stores/app-store";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { useAuthenticatedDemoStateSync } from "@/lib/use-demo-sync";
import { ResearcherDashboard } from "./researcher-dashboard";

export function ResearcherDashboardShell({
  utilityPage = null,
  externalPage = null
}: {
  utilityPage?: "Terminal" | "Nodes" | "Security" | null;
  externalPage?: {
    eyebrow: string;
    title: string;
    description: string;
    content: ReactNode;
  } | null;
}) {
  const currentUser = useAppStore((state) => state.currentUser);
  useAuthenticatedDemoStateSync(currentUser?.role === "researcher");
  const submissionDecisions = useDemoDataStore((state) => state.submissionDecisions);
  const demoResearcherSubmissions = useDemoDataStore((state) => state.demoResearcherSubmissions);

  const resolvedSubmissions = useMemo(
    () =>
      [...demoResearcherSubmissions, ...researcherSubmissions].map((submission) =>
        applySubmissionDecisionToResearcher(submission, submissionDecisions)
      ),
    [demoResearcherSubmissions, submissionDecisions]
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
      utilityPage={utilityPage}
      externalPage={externalPage}
    />
  );
}
