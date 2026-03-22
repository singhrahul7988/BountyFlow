"use client";

import Link from "next/link";
import { useState } from "react";

import { EvidenceUploadsPanel } from "@/components/evidence/evidence-uploads-panel";
import {
  resolveRemoteSubmissionDispute,
  updateRemoteSubmissionDecision
} from "@/lib/demo-api";
import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { SubmissionDecision } from "@/lib/demo-types";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { formatCurrency, truncateAddress } from "@/lib/utils";
import { StatusChip } from "../home/status-chip";

const evidenceTabs = ["POC CODE", "UPLOADS", "SCREENSHOTS", "GITHUB"] as const;
type EvidenceTab = (typeof evidenceTabs)[number];

function scoreTone(score: number) {
  if (score >= 9) {
    return "text-danger";
  }

  if (score >= 8) {
    return "text-primary";
  }

  if (score >= 6) {
    return "text-amber";
  }

  return "text-indigo";
}

function recommendedAmount(submission: AdminSubmission, payoutPct: number) {
  return Math.round((submission.tierReward * payoutPct) / 100);
}

export function AdminSubmissionDetailView({ submission }: { submission: AdminSubmission }) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>("POC CODE");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [draftRejectionReason, setDraftRejectionReason] = useState("");
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const submissionDecision = useDemoDataStore((state) => state.submissionDecisions[submission.id]);
  const syncRemoteSubmissions = useDemoDataStore((state) => state.syncRemoteSubmissions);
  const setSubmissionPayoutPct = useDemoDataStore((state) => state.setSubmissionPayoutPct);
  const applySubmissionDecision = useDemoDataStore((state) => state.applySubmissionDecision);

  const payoutPct = submissionDecision?.payoutPct ?? submission.recommendedPct;
  const status = submissionDecision?.status ?? submission.status;
  const rejectionReason = submissionDecision?.rejectionReason ?? draftRejectionReason;
  const payoutAmount = recommendedAmount(submission, payoutPct);

  async function persistDecision(nextDecision: SubmissionDecision) {
    applySubmissionDecision(submission.id, nextDecision);
    setDecisionError("");
    setIsSavingDecision(true);

    try {
      const persisted = await updateRemoteSubmissionDecision(submission.id, nextDecision);
      syncRemoteSubmissions({
        adminSubmissions: [persisted.adminSubmission],
        researcherSubmissions: [persisted.researcherSubmission],
        decisions: {
          [persisted.adminSubmission.id]: persisted.decision
        }
      });
    } catch (error) {
      setDecisionError(
        error instanceof Error
          ? `${error.message} Decision remains in local demo state.`
          : "Remote persistence failed. Decision remains in local demo state."
      );
    } finally {
      setIsSavingDecision(false);
    }
  }

  async function handleResolveDispute(resolution: "ACCEPT_CLAIM" | "HOLD_ORIGINAL") {
    setDecisionError("");
    setIsSavingDecision(true);

    try {
      const persisted = await resolveRemoteSubmissionDispute(submission.id, resolution);
      syncRemoteSubmissions({
        adminSubmissions: [persisted.adminSubmission],
        researcherSubmissions: [persisted.researcherSubmission],
        decisions: {
          [persisted.adminSubmission.id]: persisted.decision
        }
      });
      applySubmissionDecision(submission.id, persisted.decision);
      setShowRejectBox(false);
    } catch (error) {
      setDecisionError(
        error instanceof Error
          ? `${error.message} Dispute resolution was not persisted.`
          : "Dispute resolution was not persisted."
      );
    } finally {
      setIsSavingDecision(false);
    }
  }

  return (
    <section className="p-5 md:p-6 xl:p-7">
      <div className="space-y-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <Link href="/admin/submissions" className="bf-button-tertiary">
              BACK TO QUEUE
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip status={submission.severity} />
              <span className="bf-label text-muted">#{submission.id}</span>
            </div>
            <h1 className="bf-display max-w-5xl text-[2rem] leading-none tracking-tightHeading sm:text-[3rem]">
              {submission.title}
            </h1>
            <p className="bf-data text-[0.8rem] text-muted">
              {truncateAddress(submission.reporterAddress)} | REP {submission.reporterReputation.toFixed(1)} |{" "}
              {submission.submittedAt}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-surface-high p-4">
              <p className="bf-label">AI SCORE</p>
              <p className={`bf-data mt-3 text-[1.7rem] ${scoreTone(submission.aiScore)}`}>
                {submission.aiScore.toFixed(1)}
              </p>
            </div>
            <div className="bg-surface-high p-4">
              <p className="bf-label">RECOMMENDED</p>
              <p className="bf-data mt-3 text-[0.9rem] text-primary">
                {formatCurrency(recommendedAmount(submission, submission.recommendedPct), 0)} USDT
              </p>
              <p className="bf-label mt-2 text-muted">{submission.recommendedPct}% OF TIER</p>
            </div>
            <div className="bg-surface-high p-4">
              <p className="bf-label">CURRENT STATUS</p>
              <StatusChip status={status} className="mt-3" />
            </div>
          </div>
        </div>

        {status === "DISPUTE OPEN" && submission.disputeNote ? (
          <div className="border-l-[3px] border-amber bg-amber/10 p-4">
            <p className="bf-label text-amber">DISPUTE NOTE</p>
            <p className="mt-2 text-[0.8rem] leading-6 text-muted">{submission.disputeNote.reason}</p>
            {submission.disputeNote.justification ? (
              <p className="mt-2 text-[0.8rem] leading-6 text-muted">
                {submission.disputeNote.justification}
              </p>
            ) : null}
            <p className="mt-3 bf-data text-[0.85rem] text-amber">
              REQUESTED {submission.disputeNote.desiredPct}% | CURRENT {submission.disputeNote.approvedPct}%
            </p>
          </div>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[0.68fr_0.32fr]">
          <div className="space-y-6">
            <div className="bg-surface-low p-5">
              <div className="grid gap-5 md:grid-cols-[0.22fr_1fr_0.28fr] md:items-start">
                <div className="space-y-2">
                  <p className="bf-label">AI SCORE</p>
                  <p className={`bf-data text-[1.85rem] ${scoreTone(submission.aiScore)}`}>
                    {submission.aiScore.toFixed(1)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-5">
                  {submission.subScores.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <p className="bf-label">{item.label}</p>
                      <div className="h-[4px] bg-background">
                        <div
                          className="h-full bg-primary-gradient"
                          style={{ width: `${item.value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="bf-label">EVIDENCE</p>
                  <div className="flex flex-wrap gap-2">
                    {submission.evidencePills.map((pill) => (
                      <span
                        key={pill}
                        className="bg-background px-2.5 py-1.5 font-mono text-[0.64rem] uppercase tracking-label text-muted"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-low p-5">
              <p className="bf-label">FULL DESCRIPTION</p>
              <p className="mt-4 text-[0.82rem] leading-7 text-muted">{submission.description}</p>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="bg-surface-low p-5">
                <p className="bf-label">REPRODUCTION STEPS</p>
                <ol className="mt-4 space-y-2 font-mono text-[0.82rem] leading-7 text-muted">
                  {submission.stepsToReproduce.map((step, index) => (
                    <li key={step}>
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-surface-low p-5">
                <p className="bf-label">IMPACT ASSESSMENT</p>
                <p className="mt-4 text-[0.82rem] leading-7 text-muted">{submission.impactAssessment}</p>
                {submission.internalNote ? (
                  <div className="mt-5 bg-background p-4">
                    <p className="bf-label text-primary">INTERNAL NOTE</p>
                    <p className="mt-2 text-[0.8rem] leading-6 text-muted">{submission.internalNote}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 bg-surface-low p-5">
              <div className="flex flex-wrap gap-4 border-b border-outline-variant/15 pb-3">
                {evidenceTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 pb-3 font-mono text-[0.72rem] uppercase tracking-label transition-colors duration-100 ease-linear ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    {tab === "SCREENSHOTS" ? `SCREENSHOTS (${submission.screenshots.length})` : tab}
                  </button>
                ))}
              </div>

              {activeTab === "POC CODE" ? (
                <pre className="overflow-x-auto bg-surface-container-highest p-4 font-mono text-[0.72rem] leading-6 text-muted">
                  <code>{submission.codeSnippet}</code>
                </pre>
              ) : null}

              {activeTab === "UPLOADS" ? (
                <EvidenceUploadsPanel files={submission.uploadedFiles ?? []} />
              ) : null}

              {activeTab === "SCREENSHOTS" ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {submission.screenshots.map((shot) => (
                    <div key={shot} className="bg-background p-5">
                      <p className="bf-label text-primary">SCREENSHOT</p>
                      <p className="mt-3 text-[0.8rem] leading-6 text-muted">{shot}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === "GITHUB" ? (
                <div className="bg-background p-5">
                  <p className="bf-label text-primary">GITHUB METADATA</p>
                  <div className="mt-4 space-y-2 text-[0.8rem] leading-6 text-muted">
                    <p>REPO: {submission.github.repo}</p>
                    <p>BRANCH: {submission.github.branch}</p>
                    <p>UPDATED: {submission.github.updatedAt}</p>
                    <p>URL: {submission.github.url}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <div className="space-y-5 bg-surface-low p-5">
              <p className="bf-label text-primary">PAYOUT DECISION</p>

              <div className="space-y-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={10}
                  value={payoutPct}
                  onChange={(event) => setSubmissionPayoutPct(submission.id, Number(event.target.value))}
                  className="h-2 w-full accent-[var(--primary-container)]"
                />
                <div className="flex flex-wrap gap-2">
                  {[40, 60, 80, 100].map((quickValue) => (
                    <button
                      key={quickValue}
                      type="button"
                      onClick={() => setSubmissionPayoutPct(submission.id, quickValue)}
                      className="bf-button-secondary px-3 py-2"
                    >
                      {quickValue}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 bg-background p-4">
                <p className="bf-data text-[1.7rem] text-primary">{payoutPct}%</p>
                <p className="bf-data text-[0.9rem] text-primary">
                  {formatCurrency(payoutAmount, 0)} USDT
                </p>
              </div>

              {showRejectBox ? (
                <label className="space-y-3">
                  <span className="bf-label text-error">REJECTION REASON</span>
                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setDraftRejectionReason(event.target.value)}
                    className="bf-terminal-input min-h-[110px] resize-y"
                    placeholder="Explain why the submission is being rejected."
                  />
                </label>
              ) : null}

              {status === "DISPUTE OPEN" ? (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => void handleResolveDispute("ACCEPT_CLAIM")}
                    className="bf-button-primary justify-center"
                    disabled={isSavingDecision}
                  >
                    {isSavingDecision ? "RESOLVING..." : "ACCEPT RESEARCHER CLAIM ->"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResolveDispute("HOLD_ORIGINAL")}
                    className="bf-button-secondary justify-center"
                    disabled={isSavingDecision}
                  >
                    HOLD AT ORIGINAL %
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void persistDecision({
                        status: "DISPUTE WINDOW",
                        payoutPct
                      });
                      setShowRejectBox(false);
                    }}
                    className="bf-button-primary justify-center"
                    disabled={isSavingDecision}
                  >
                    {isSavingDecision ? "SAVING..." : "APPROVE & RELEASE USDT ->"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void persistDecision({
                        status: "UNDER REVIEW",
                        payoutPct
                      });
                      setShowRejectBox(false);
                    }}
                    className="bf-button-secondary justify-center"
                    disabled={isSavingDecision}
                  >
                    MARK FOR MANUAL REVIEW
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectBox((current) => !current)}
                    className="inline-flex items-center justify-center border border-danger/35 px-4 py-3 font-mono text-[0.75rem] uppercase tracking-label text-danger transition-colors duration-100 ease-linear hover:border-danger hover:bg-danger/10"
                  >
                    REJECT SUBMISSION
                  </button>
                  {showRejectBox ? (
                    <button
                      type="button"
                      onClick={() => {
                        void persistDecision({
                          status: "REJECTED",
                          payoutPct,
                          rejectionReason: draftRejectionReason
                        });
                        setShowRejectBox(false);
                      }}
                      className="inline-flex items-center justify-center border border-danger/35 px-4 py-3 font-mono text-[0.75rem] uppercase tracking-label text-danger transition-colors duration-100 ease-linear hover:border-danger hover:bg-danger/10"
                      disabled={isSavingDecision}
                    >
                      CONFIRM REJECTION
                    </button>
                  ) : null}
                </div>
              )}

              {decisionError ? <p className="text-[0.8rem] leading-6 text-amber">{decisionError}</p> : null}

              <p className="text-[0.8rem] leading-6 text-muted">
                Approved payouts enter a 48-hour dispute window before autonomous USDT release from
                escrow.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
