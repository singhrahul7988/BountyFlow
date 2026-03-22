"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EvidenceUploadsPanel } from "@/components/evidence/evidence-uploads-panel";
import { TerminalSelect } from "@/components/ui/terminal-select";
import {
  resolveRemoteSubmissionDispute,
  updateRemoteSubmissionDecision
} from "@/lib/demo-api";
import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { SubmissionDecision } from "@/lib/demo-types";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { formatCurrency, truncateAddress } from "@/lib/utils";
import { StatusChip } from "../home/status-chip";

const filterTabs = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "NEEDS ACTION"] as const;
const sortOptions = ["NEWEST", "HIGHEST_SCORE", "RECOMMENDED_PAYOUT"] as const;
const evidenceTabs = ["POC CODE", "UPLOADS", "SCREENSHOTS", "GITHUB"] as const;

type SortValue = (typeof sortOptions)[number];
type FilterValue = (typeof filterTabs)[number];
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

export function AdminSubmissionsQueue({ items }: { items: AdminSubmission[] }) {
  const submissionDecisions = useDemoDataStore((state) => state.submissionDecisions);
  const syncRemoteSubmissions = useDemoDataStore((state) => state.syncRemoteSubmissions);
  const setSubmissionPayoutPct = useDemoDataStore((state) => state.setSubmissionPayoutPct);
  const applySubmissionDecision = useDemoDataStore((state) => state.applySubmissionDecision);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("ALL");
  const [sortBy, setSortBy] = useState<SortValue>("NEWEST");
  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedCriticalBanner, setDismissedCriticalBanner] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);
  const [evidenceTabById, setEvidenceTabById] = useState<Record<string, EvidenceTab>>({});
  const [rejectionModeById, setRejectionModeById] = useState<Record<string, boolean>>({});
  const [rejectionReasonById, setRejectionReasonById] = useState<Record<string, string>>({});
  const [savingDecisionById, setSavingDecisionById] = useState<Record<string, boolean>>({});
  const [decisionErrorById, setDecisionErrorById] = useState<Record<string, string>>({});

  const criticalSubmission = items.find((submission) => submission.aiScore >= 9);

  const filterCounts = useMemo(() => {
    return filterTabs.reduce<Record<FilterValue, number>>(
      (accumulator, filterValue) => {
        if (filterValue === "ALL") {
          accumulator[filterValue] = items.length;
          return accumulator;
        }

        if (filterValue === "NEEDS ACTION") {
          accumulator[filterValue] = items.filter((submission) =>
            ["AI SCORED", "UNDER REVIEW", "DISPUTE OPEN"].includes(
              submissionDecisions[submission.id]?.status ?? submission.status
            )
          ).length;
          return accumulator;
        }

        accumulator[filterValue] = items.filter(
          (submission) => submission.severity === filterValue
        ).length;
        return accumulator;
      },
      {
        ALL: 0,
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        "NEEDS ACTION": 0
      }
    );
  }, [items, submissionDecisions]);

  const visibleSubmissions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = items.filter((submission) => {
      const currentStatus = submissionDecisions[submission.id]?.status ?? submission.status;
      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "NEEDS ACTION"
          ? ["AI SCORED", "UNDER REVIEW", "DISPUTE OPEN"].includes(currentStatus)
          : submission.severity === activeFilter);

      const haystack = [
        submission.id,
        submission.title,
        submission.reporterAddress,
        submission.summaryRisk
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });

    return filtered.sort((left, right) => {
      if (sortBy === "HIGHEST_SCORE") {
        return right.aiScore - left.aiScore;
      }

      if (sortBy === "RECOMMENDED_PAYOUT") {
        return (
          recommendedAmount(
            right,
            submissionDecisions[right.id]?.payoutPct ?? right.recommendedPct
          ) -
          recommendedAmount(
            left,
            submissionDecisions[left.id]?.payoutPct ?? left.recommendedPct
          )
        );
      }

      return items.findIndex((item) => item.id === left.id) - items.findIndex((item) => item.id === right.id);
    });
  }, [activeFilter, items, searchQuery, sortBy, submissionDecisions]);

  async function persistDecision(submissionId: string, nextDecision: SubmissionDecision) {
    applySubmissionDecision(submissionId, nextDecision);
    setSavingDecisionById((current) => ({ ...current, [submissionId]: true }));
    setDecisionErrorById((current) => ({ ...current, [submissionId]: "" }));

    try {
      const persisted = await updateRemoteSubmissionDecision(submissionId, nextDecision);
      syncRemoteSubmissions({
        adminSubmissions: [persisted.adminSubmission],
        researcherSubmissions: [persisted.researcherSubmission],
        decisions: {
          [persisted.adminSubmission.id]: persisted.decision
        }
      });
    } catch (error) {
      setDecisionErrorById((current) => ({
        ...current,
        [submissionId]:
          error instanceof Error
            ? `${error.message} Decision remains in local demo state.`
            : "Remote persistence failed. Decision remains in local demo state."
      }));
    } finally {
      setSavingDecisionById((current) => ({ ...current, [submissionId]: false }));
    }
  }

  async function handleResolveDispute(submission: AdminSubmission, resolution: "ACCEPT_CLAIM" | "HOLD_ORIGINAL") {
    setSavingDecisionById((current) => ({ ...current, [submission.id]: true }));
    setDecisionErrorById((current) => ({ ...current, [submission.id]: "" }));

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
    } catch (error) {
      setDecisionErrorById((current) => ({
        ...current,
        [submission.id]:
          error instanceof Error
            ? `${error.message} Dispute resolution was not persisted.`
            : "Dispute resolution was not persisted."
      }));
    } finally {
      setSavingDecisionById((current) => ({ ...current, [submission.id]: false }));
    }
  }

  function handleApprove(submissionId: string) {
    void persistDecision(submissionId, {
      status: "DISPUTE WINDOW",
      payoutPct:
        submissionDecisions[submissionId]?.payoutPct ??
        items.find((item) => item.id === submissionId)?.recommendedPct ??
        0
    });
    setRejectionModeById((current) => ({ ...current, [submissionId]: false }));
  }

  function handleManualReview(submissionId: string) {
    void persistDecision(submissionId, {
      status: "UNDER REVIEW",
      payoutPct:
        submissionDecisions[submissionId]?.payoutPct ??
        items.find((item) => item.id === submissionId)?.recommendedPct ??
        0
    });
    setRejectionModeById((current) => ({ ...current, [submissionId]: false }));
  }

  function handleReject(submissionId: string) {
    void persistDecision(submissionId, {
      status: "REJECTED",
      payoutPct:
        submissionDecisions[submissionId]?.payoutPct ??
        items.find((item) => item.id === submissionId)?.recommendedPct ??
        0,
      rejectionReason: rejectionReasonById[submissionId] ?? ""
    });
    setRejectionModeById((current) => ({ ...current, [submissionId]: false }));
  }

  return (
    <section className="p-6 md:p-8 xl:p-10">
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="bf-label text-primary">ADMIN QUEUE</p>
          <h1 className="bf-display text-[2.7rem] leading-none tracking-tightHeading sm:text-[3.9rem]">
            SUBMISSIONS
          </h1>
        </div>

        {criticalSubmission && !dismissedCriticalBanner ? (
          <div className="flex flex-col gap-4 border-l-[4px] border-danger bg-danger/5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 animate-pulse-dot bg-danger" />
              <p className="font-mono text-[0.78rem] uppercase tracking-label text-danger">
                CRITICAL FINDING | SCORE {criticalSubmission.aiScore.toFixed(1)}
              </p>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-foreground">
              {criticalSubmission.title} | {criticalSubmission.summaryRisk}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExpandedId(criticalSubmission.id)}
                className="inline-flex items-center justify-center border border-danger/35 px-4 py-3 font-mono text-[0.75rem] uppercase tracking-label text-danger transition-colors duration-100 ease-linear hover:border-danger hover:bg-danger/10"
              >
                REVIEW NOW -&gt;
              </button>
              <button
                type="button"
                aria-label="Dismiss critical alert"
                onClick={() => setDismissedCriticalBanner(true)}
                className="font-mono text-sm text-muted transition-colors duration-100 ease-linear hover:text-foreground"
              >
                X
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 bg-surface-high p-6 xl:grid-cols-[1.35fr_0.55fr_0.7fr]">
          <div className="flex flex-wrap gap-6 border-b border-outline-variant/15 pb-3 xl:border-0 xl:pb-0">
            {filterTabs.map((filterValue) => (
              <button
                key={filterValue}
                type="button"
                onClick={() => setActiveFilter(filterValue)}
                className={`border-b-2 pb-3 font-mono text-[0.78rem] uppercase tracking-label transition-colors duration-100 ease-linear ${
                  activeFilter === filterValue
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {filterValue} ({filterCounts[filterValue]})
              </button>
            ))}
          </div>

          <label className="space-y-3">
            <span className="bf-label">SORT</span>
            <TerminalSelect
              value={sortBy}
              onChange={(value) => setSortBy(value as SortValue)}
              options={sortOptions.map((option) => ({
                label: option.replaceAll("_", " "),
                value: option
              }))}
              ariaLabel="Sort submissions"
            />
          </label>

          <label className="space-y-3">
            <span className="bf-label">SEARCH</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="bf-terminal-input"
              placeholder="Search title, ID, or wallet"
            />
          </label>
        </div>

        <div className="space-y-6">
          {visibleSubmissions.map((submission) => {
            const currentStatus = submissionDecisions[submission.id]?.status ?? submission.status;
            const isExpanded = expandedId === submission.id;
            const payoutPct = submissionDecisions[submission.id]?.payoutPct ?? submission.recommendedPct;
            const payoutAmount = recommendedAmount(submission, payoutPct);
            const activeEvidenceTab = evidenceTabById[submission.id] ?? "POC CODE";
            const showRejectionBox = rejectionModeById[submission.id] ?? false;
            const isSavingDecision = savingDecisionById[submission.id] ?? false;
            const decisionError = decisionErrorById[submission.id];

            return (
              <article
                key={submission.id}
                className={`space-y-6 bg-surface-high p-6 md:p-7 ${
                  submission.aiScore >= 9
                    ? "border border-danger/30 shadow-[0_0_12px_rgba(110,255,192,0.1)]"
                    : currentStatus === "DISPUTE OPEN"
                      ? "border border-amber/25"
                      : ""
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusChip status={submission.severity} />
                      <span className="bf-label text-muted">#{submission.id}</span>
                    </div>
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="inline-block transition-colors duration-100 ease-linear hover:text-primary"
                    >
                      <h2 className="bf-display text-[1.5rem] leading-none tracking-tightHeading">
                        {submission.title}
                      </h2>
                    </Link>
                    <p className="bf-data text-[0.82rem] text-muted">
                      {truncateAddress(submission.reporterAddress)} | Rep:{" "}
                      {submission.reporterReputation.toFixed(1)} | {submission.submittedAt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="bf-button-tertiary px-4 py-3 text-primary"
                    >
                      FULL PAGE
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) => (current === submission.id ? null : submission.id))
                      }
                      className="bf-button-secondary px-4 py-3"
                    >
                      {isExpanded ? "HIDE REPORT" : "VIEW REPORT"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(submission.id);
                        handleApprove(submission.id);
                      }}
                      className="bf-button-primary px-4 py-3"
                      disabled={isSavingDecision}
                    >
                      {isSavingDecision ? "SAVING..." : "APPROVE"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.78fr_0.22fr]">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start">
                      <div className="space-y-2">
                        <p className="bf-label">AI SCORE</p>
                        <p className={`bf-data text-[2rem] ${scoreTone(submission.aiScore)}`}>
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

                      <div className="space-y-2 justify-self-start md:justify-self-end">
                        <p className="bf-label">RECOMMENDED</p>
                        <p className="bf-data text-[1rem] text-primary">
                          {formatCurrency(recommendedAmount(submission, submission.recommendedPct), 0)}{" "}
                          USDT ({submission.recommendedPct}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {submission.evidencePills.map((pill) => (
                        <span
                          key={pill}
                          className="bg-background px-3 py-2 font-mono text-[0.72rem] uppercase tracking-label text-muted"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <StatusChip status={currentStatus} />
                      <p className="bf-label text-foreground">NEEDS OWNER ACTION</p>
                    </div>
                  </div>
                </div>

                {currentStatus === "DISPUTE OPEN" && submission.disputeNote ? (
                  <div className="border-l-[3px] border-amber bg-amber/10 p-4">
                    <p className="bf-label text-amber">DISPUTE NOTE</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {submission.disputeNote.reason}
                    </p>
                    {submission.disputeNote.justification ? (
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {submission.disputeNote.justification}
                      </p>
                    ) : null}
                    <p className="mt-3 bf-data text-[0.85rem] text-amber">
                      REQUESTED {submission.disputeNote.desiredPct}% | CURRENT{" "}
                      {submission.disputeNote.approvedPct}%
                    </p>
                  </div>
                ) : null}

                {isExpanded ? (
                  <div className="space-y-6">
                    <div className="space-y-4 bg-background p-5">
                      <p className="bf-label">FULL DESCRIPTION</p>
                      <p className="text-sm leading-8 text-muted">{submission.description}</p>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="space-y-4 bg-background p-5">
                        <p className="bf-label">REPRODUCTION STEPS</p>
                        <ol className="space-y-2 font-mono text-sm leading-8 text-muted">
                          {submission.stepsToReproduce.map((step, index) => (
                            <li key={step}>
                              {index + 1}. {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="space-y-4 bg-background p-5">
                        <p className="bf-label">IMPACT ASSESSMENT</p>
                        <p className="text-sm leading-8 text-muted">
                          {submission.impactAssessment}
                        </p>
                        {submission.internalNote ? (
                          <div className="bg-surface-high p-4">
                            <p className="bf-label text-primary">INTERNAL NOTE</p>
                            <p className="mt-2 text-sm leading-7 text-muted">
                              {submission.internalNote}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-4 border-b border-outline-variant/15 pb-3">
                        {evidenceTabs.map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() =>
                              setEvidenceTabById((current) => ({ ...current, [submission.id]: tab }))
                            }
                            className={`border-b-2 pb-3 font-mono text-[0.78rem] uppercase tracking-label transition-colors duration-100 ease-linear ${
                              activeEvidenceTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-muted hover:text-foreground"
                            }`}
                          >
                            {tab === "SCREENSHOTS"
                              ? `SCREENSHOTS (${submission.screenshots.length})`
                              : tab}
                          </button>
                        ))}
                      </div>

                      {activeEvidenceTab === "POC CODE" ? (
                        <pre className="overflow-x-auto bg-surface-container-highest p-5 font-mono text-xs leading-7 text-muted">
                          <code>{submission.codeSnippet}</code>
                        </pre>
                      ) : null}

                      {activeEvidenceTab === "UPLOADS" ? (
                        <EvidenceUploadsPanel files={submission.uploadedFiles ?? []} />
                      ) : null}

                      {activeEvidenceTab === "SCREENSHOTS" ? (
                        <div className="grid gap-4 sm:grid-cols-3">
                          {submission.screenshots.map((shot) => (
                            <div key={shot} className="bg-background p-5">
                              <p className="bf-label text-primary">SCREENSHOT</p>
                              <p className="mt-3 text-sm leading-7 text-muted">{shot}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {activeEvidenceTab === "GITHUB" ? (
                        <div className="bg-background p-5">
                          <p className="bf-label text-primary">GITHUB METADATA</p>
                          <div className="mt-4 space-y-2 text-sm leading-7 text-muted">
                            <p>REPO: {submission.github.repo}</p>
                            <p>BRANCH: {submission.github.branch}</p>
                            <p>UPDATED: {submission.github.updatedAt}</p>
                            <p>URL: {submission.github.url}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-5 bg-background p-5 md:p-6">
                      <p className="bf-label text-primary">PAYOUT DECISION</p>
                      <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr] xl:items-end">
                        <div className="space-y-4">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={10}
                            value={payoutPct}
                            onChange={(event) =>
                              setSubmissionPayoutPct(submission.id, Number(event.target.value))
                            }
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

                        <div className="space-y-2">
                          <p className="bf-data text-[2rem] text-primary">{payoutPct}%</p>
                          <p className="bf-data text-[1rem] text-primary">
                            {formatCurrency(payoutAmount, 0)} USDT
                          </p>
                        </div>
                      </div>

                      {showRejectionBox ? (
                        <label className="space-y-3">
                          <span className="bf-label text-error">REJECTION REASON</span>
                          <textarea
                            value={rejectionReasonById[submission.id] ?? ""}
                            onChange={(event) =>
                              setRejectionReasonById((current) => ({
                                ...current,
                                [submission.id]: event.target.value
                              }))
                            }
                            className="bf-terminal-input min-h-[110px] resize-y"
                            placeholder="Explain why the submission is being rejected."
                          />
                        </label>
                      ) : null}

                      {currentStatus === "DISPUTE OPEN" ? (
                        <div className="flex flex-col gap-3 xl:flex-row">
                          <button
                            type="button"
                            onClick={() => void handleResolveDispute(submission, "ACCEPT_CLAIM")}
                            className="bf-button-primary justify-center xl:flex-1"
                            disabled={isSavingDecision}
                          >
                            {isSavingDecision ? "RESOLVING..." : "ACCEPT RESEARCHER CLAIM ->"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleResolveDispute(submission, "HOLD_ORIGINAL")}
                            className="bf-button-secondary justify-center"
                            disabled={isSavingDecision}
                          >
                            HOLD AT ORIGINAL %
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 xl:flex-row">
                          <button
                            type="button"
                            onClick={() => handleApprove(submission.id)}
                            className="bf-button-primary justify-center xl:flex-1"
                            disabled={isSavingDecision}
                          >
                            {isSavingDecision ? "SAVING..." : "APPROVE & RELEASE USDT ->"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleManualReview(submission.id)}
                            className="bf-button-secondary justify-center"
                            disabled={isSavingDecision}
                          >
                            MARK FOR MANUAL REVIEW
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRejectionModeById((current) => ({
                                ...current,
                                [submission.id]: !showRejectionBox
                              }))
                            }
                            className="inline-flex items-center justify-center border border-danger/35 px-4 py-3 font-mono text-[0.75rem] uppercase tracking-label text-danger transition-colors duration-100 ease-linear hover:border-danger hover:bg-danger/10"
                          >
                            REJECT SUBMISSION
                          </button>
                        </div>
                      )}

                      {showRejectionBox ? (
                        <button
                          type="button"
                          onClick={() => handleReject(submission.id)}
                          className="inline-flex items-center justify-center border border-danger/35 px-4 py-3 font-mono text-[0.75rem] uppercase tracking-label text-danger transition-colors duration-100 ease-linear hover:border-danger hover:bg-danger/10"
                          disabled={isSavingDecision}
                        >
                          CONFIRM REJECTION
                        </button>
                      ) : null}

                      {decisionError ? (
                        <p className="text-sm leading-7 text-amber">{decisionError}</p>
                      ) : null}

                      <p className="text-sm leading-7 text-muted">
                        Approved payouts enter a 48-hour dispute window before autonomous USDT
                        release from escrow.
                      </p>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
