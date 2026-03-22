import { useState } from "react";
import Link from "next/link";

import { EvidenceUploadsPanel } from "@/components/evidence/evidence-uploads-panel";
import { openRemoteSubmissionDispute } from "@/lib/demo-api";
import { getLinkedAdminSubmissionId } from "@/lib/demo-lifecycle";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { formatCurrency } from "@/lib/utils";
import { StatusChip } from "../home/status-chip";

function scoreTone(score: number) {
  if (score >= 8) {
    return "text-primary";
  }

  if (score >= 6) {
    return "text-amber";
  }

  if (score >= 4) {
    return "text-indigo";
  }

  return "text-muted";
}

export function SubmissionDetailView({ submission }: { submission: ResearcherSubmission }) {
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeJustification, setDisputeJustification] = useState("");
  const [disputeDesiredPct, setDisputeDesiredPct] = useState(80);
  const [disputeError, setDisputeError] = useState("");
  const syncRemoteSubmissions = useDemoDataStore((state) => state.syncRemoteSubmissions);
  const applySubmissionDecision = useDemoDataStore((state) => state.applySubmissionDecision);
  const submissionDecisions = useDemoDataStore((state) => state.submissionDecisions);
  const adminId = getLinkedAdminSubmissionId(submission.id);
  const currentDecision = adminId ? submissionDecisions[adminId] : undefined;

  async function handleOpenDispute() {
    if (!adminId || !disputeReason.trim() || !disputeJustification.trim()) {
      setDisputeError("Add a dispute reason and a justification before opening the dispute.");
      return;
    }

    setIsSubmittingDispute(true);
    setDisputeError("");

    try {
      const persisted = await openRemoteSubmissionDispute(submission.id, {
        reason: disputeReason.trim(),
        desiredPct: disputeDesiredPct,
        justification: disputeJustification.trim()
      });
      syncRemoteSubmissions({
        adminSubmissions: [persisted.adminSubmission],
        researcherSubmissions: [persisted.researcherSubmission],
        decisions: {
          [persisted.adminSubmission.id]: persisted.decision
        }
      });
      applySubmissionDecision(persisted.adminSubmission.id, persisted.decision);
      setIsDisputeOpen(false);
    } catch (error) {
      setDisputeError(
        error instanceof Error
          ? error.message
          : "Unable to open the dispute right now."
      );
    } finally {
      setIsSubmittingDispute(false);
    }
  }

  return (
    <section className="bf-shell pt-32 pb-24">
      <div className="space-y-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <Link href="/dashboard" className="bf-button-tertiary">
              BACK TO DASHBOARD
            </Link>
            <p className="bf-label text-primary">{submission.id.toUpperCase()}</p>
            <h1 className="bf-display text-[2.5rem] leading-none tracking-tightHeading sm:text-[3.8rem]">
              {submission.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip status={submission.status} />
              <StatusChip status={submission.severity} />
              <span className="bf-label text-foreground">{submission.bountyName}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-surface-high p-5">
              <p className="bf-label">AI SCORE</p>
              <p className={`bf-data mt-3 text-[1.8rem] ${scoreTone(submission.aiScore)}`}>
                {submission.aiScore > 0 ? submission.aiScore.toFixed(1) : "--"}
              </p>
            </div>
            <div className="bg-surface-high p-5">
              <p className="bf-label">PAYOUT</p>
              <p className="bf-data mt-3 text-[1.2rem] text-primary">
                {submission.payout > 0 ? `${formatCurrency(submission.payout, 0)} USDT` : "--"}
              </p>
              {submission.responseEta ? (
                <p className="bf-label mt-2 text-muted">{submission.responseEta}</p>
              ) : null}
            </div>
            <div className="bg-surface-high p-5">
              <p className="bf-label">SUBMITTED</p>
              <p className="bf-data mt-3 text-[0.86rem] text-muted">{submission.submittedAt}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.68fr_0.32fr]">
          <div className="space-y-6">
            <div className="bg-surface-low p-6 md:p-7">
              <p className="bf-label">DESCRIPTION</p>
              <p className="mt-4 text-sm leading-8 text-muted">{submission.description}</p>
            </div>

            <div className="bg-surface-low p-6 md:p-7">
              <p className="bf-label">STEPS TO REPRODUCE</p>
              <ol className="mt-4 space-y-3 font-mono text-sm leading-8 text-muted">
                {submission.stepsToReproduce.map((step, index) => (
                  <li key={step}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-surface-low p-6 md:p-7">
              <p className="bf-label">IMPACT ASSESSMENT</p>
              <p className="mt-4 text-sm leading-8 text-muted">{submission.impactAssessment}</p>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="bg-surface-low p-6">
              <p className="bf-label">EVIDENCE PACKAGE</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">CODE FILES</span>
                  <span className="bf-data text-[0.9rem] text-primary">
                    {submission.evidence.codeFiles}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">SCREENSHOTS</span>
                  <span className="bf-data text-[0.9rem] text-primary">
                    {submission.evidence.screenshots}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">REFERENCES</span>
                  <span className="bf-data text-[0.9rem] text-primary">
                    {submission.evidence.references.length}
                  </span>
                </div>
              </div>
              {submission.evidence.uploadedFiles?.length ? (
                <div className="mt-5 space-y-3">
                  <p className="bf-label text-primary">UPLOADED ARTIFACTS</p>
                  <EvidenceUploadsPanel files={submission.evidence.uploadedFiles} />
                </div>
              ) : null}
              {submission.evidence.githubUrl ? (
                <Link
                  href={submission.evidence.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bf-button-tertiary mt-5"
                >
                  VIEW GITHUB POC
                </Link>
              ) : null}
            </div>

            {submission.status === "DISPUTE WINDOW" ? (
              <div className="bg-surface-low p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <p className="bf-label text-primary">DISPUTE WINDOW</p>
                    <p className="text-sm leading-7 text-muted">
                      You can challenge the approved payout percentage during the 48-hour dispute
                      window if the finding was undervalued.
                    </p>
                    {currentDecision ? (
                      <p className="bf-data text-[0.9rem] text-primary">
                        CURRENT APPROVED PCT: {currentDecision.payoutPct}%
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDisputeOpen((current) => !current)}
                    className="bf-button-secondary"
                  >
                    {isDisputeOpen ? "CANCEL" : "OPEN DISPUTE"}
                  </button>
                </div>

                {isDisputeOpen ? (
                  <div className="mt-5 space-y-4">
                    <label className="space-y-2">
                      <span className="bf-label text-foreground">REASON</span>
                      <textarea
                        value={disputeReason}
                        maxLength={500}
                        onChange={(event) => setDisputeReason(event.target.value)}
                        className="bf-terminal-input min-h-[110px] resize-y"
                        placeholder="Why does this finding deserve a higher payout percentage?"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="bf-label text-foreground">DESIRED PERCENTAGE</span>
                      <div className="flex flex-wrap gap-2">
                        {[60, 80, 100].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setDisputeDesiredPct(value)}
                            className={`bf-button-secondary px-3 py-2 ${
                              disputeDesiredPct === value ? "border-primary text-primary" : ""
                            }`}
                          >
                            {value}%
                          </button>
                        ))}
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className="bf-label text-foreground">JUSTIFICATION</span>
                      <textarea
                        value={disputeJustification}
                        maxLength={500}
                        onChange={(event) => setDisputeJustification(event.target.value)}
                        className="bf-terminal-input min-h-[110px] resize-y"
                        placeholder="Cite completeness, exploitability, or impact evidence that supports the requested percentage."
                      />
                    </label>

                    {disputeError ? <p className="text-sm leading-7 text-amber">{disputeError}</p> : null}

                    <button
                      type="button"
                      onClick={() => void handleOpenDispute()}
                      className="bf-button-primary justify-center"
                      disabled={isSubmittingDispute}
                    >
                      {isSubmittingDispute ? "OPENING..." : "SUBMIT DISPUTE ->"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {submission.status === "DISPUTE OPEN" && submission.dispute ? (
              <div className="border-l-[3px] border-amber bg-amber/10 p-6">
                <p className="bf-label text-amber">DISPUTE OPEN</p>
                <p className="mt-3 text-sm leading-7 text-muted">{submission.dispute.reason}</p>
                <p className="mt-3 bf-data text-[0.86rem] text-amber">
                  REQUESTED {submission.dispute.desiredPct}% | CURRENT {submission.dispute.approvedPct}%
                </p>
              </div>
            ) : null}

            {submission.txHash ? (
              <div className="bg-surface-low p-6">
                <p className="bf-label">ON-CHAIN RECEIPT</p>
                <p className="bf-data mt-4 text-[0.86rem] text-primary">{submission.txHash}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
