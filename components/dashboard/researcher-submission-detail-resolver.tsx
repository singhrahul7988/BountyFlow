"use client";

import { applySubmissionDecisionToResearcher } from "@/lib/demo-lifecycle";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { SubmissionDetailView } from "./submission-detail-view";

export function ResearcherSubmissionDetailResolver({
  submission
}: {
  submission: ResearcherSubmission;
}) {
  const submissionDecisions = useDemoDataStore((state) => state.submissionDecisions);
  const resolvedSubmission = applySubmissionDecisionToResearcher(submission, submissionDecisions);

  return <SubmissionDetailView submission={resolvedSubmission} />;
}
