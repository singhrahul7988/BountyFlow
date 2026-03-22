"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BountyCard } from "@/components/home/bounty-card";
import { bounties } from "@/lib/bounty-data";
import {
  type DashboardSummary,
  type PayoutHistoryEntry,
  type ResearcherSubmission,
  reputationBreakdown
} from "@/lib/dashboard-data";
import { leaderboardRows } from "@/lib/mock-data";
import { useAppStore } from "@/lib/stores/app-store";
import { formatCurrency, truncateAddress } from "@/lib/utils";
import { StatusChip } from "../home/status-chip";
import { WalletLinkButton } from "../wallet/wallet-link-button";

const filters = ["ALL", "ACTIVE", "UNDER REVIEW", "RESOLVED", "REJECTED"] as const;

function getFilterBucket(status: ResearcherSubmission["status"]) {
  if (status === "DRAFT" || status === "SUBMITTED" || status === "AI SCORING") {
    return "ACTIVE";
  }

  if (
    status === "AI SCORED" ||
    status === "UNDER REVIEW" ||
    status === "DISPUTE WINDOW" ||
    status === "DISPUTE OPEN"
  ) {
    return "UNDER REVIEW";
  }

  if (status === "REJECTED") {
    return "REJECTED";
  }

  return "RESOLVED";
}

function getScoreTone(score: number) {
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

function getActionLabel(submission: ResearcherSubmission) {
  if (submission.status === "DISPUTE WINDOW") {
    return "OPEN DISPUTE";
  }

  if (submission.status === "AI SCORING" || submission.status === "SUBMITTED") {
    return "TRACK ->";
  }

  return "VIEW DETAILS ->";
}

export function ResearcherDashboard({
  submissions,
  summary,
  payoutHistory
}: {
  submissions: ResearcherSubmission[];
  summary: DashboardSummary;
  payoutHistory: PayoutHistoryEntry[];
}) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("ALL");
  const { currentUser, hasHydrated } = useAppStore();
  const featuredBounties = bounties.slice(0, 3);
  const leaderboardPreview = leaderboardRows.slice(0, 5);

  const filterCounts = useMemo(() => {
    return filters.reduce<Record<(typeof filters)[number], number>>(
      (accumulator, filterValue) => {
        if (filterValue === "ALL") {
          accumulator[filterValue] = submissions.length;
          return accumulator;
        }

        accumulator[filterValue] = submissions.filter(
          (submission) => getFilterBucket(submission.status) === filterValue
        ).length;

        return accumulator;
      },
      {
        ALL: 0,
        ACTIVE: 0,
        "UNDER REVIEW": 0,
        RESOLVED: 0,
        REJECTED: 0
      }
    );
  }, [submissions]);

  const visibleSubmissions = useMemo(() => {
    if (activeFilter === "ALL") {
      return submissions;
    }

    return submissions.filter(
      (submission) => getFilterBucket(submission.status) === activeFilter
    );
  }, [activeFilter, submissions]);

  const reputationProgress = `${Math.min(100, summary.reputationScore * 10)}%`;
  const totalReceived = payoutHistory.reduce((total, entry) => total + entry.amount, 0);

  return (
    <section className="bf-shell pt-32 pb-24">
      <div className="space-y-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="bf-label text-primary">RESEARCHER TERMINAL</p>
            <h1 className="bf-display text-[2.8rem] leading-none tracking-tightHeading sm:text-[4rem]">
              MY DASHBOARD
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/bounties" className="bf-button-primary">
              SUBMIT NEW FINDING
              <span aria-hidden="true">-&gt;</span>
            </Link>

            {hasHydrated && currentUser ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 bg-surface-high px-4 py-3">
                  <span className="h-2 w-2 animate-pulse-dot bg-primary" />
                  <span className="bf-data text-[0.9rem] text-foreground">
                    {currentUser.walletLinked
                      ? truncateAddress(currentUser.walletAddress)
                      : "PAYOUT WALLET NOT LINKED"}
                  </span>
                </div>
                <WalletLinkButton className="justify-center" />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-surface-high px-4 py-3">
                <span className="h-2 w-2 bg-primary" />
                <span className="bf-label text-foreground">AUTHENTICATED SESSION</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <article className="space-y-4 bg-surface-high p-6">
            <p className="bf-label">TOTAL EARNED</p>
            <p className="bf-data text-[2.3rem] text-primary">
              {formatCurrency(summary.totalEarned, 0)}
            </p>
            <p className="text-sm leading-7 text-muted">USDT settled from verified on-chain payouts.</p>
          </article>

          <article className="space-y-4 bg-surface-high p-6">
            <p className="bf-label">SUBMISSIONS</p>
            <p className="bf-data text-[2.3rem] text-foreground">{summary.submissions}</p>
            <p className="text-sm leading-7 text-muted">
              {summary.active} ACTIVE | {summary.review} REVIEW | {summary.resolved} RESOLVED
            </p>
          </article>

          <article className="space-y-4 bg-surface-high p-6">
            <p className="bf-label">REPUTATION SCORE</p>
            <p className="bf-data text-[2.3rem] text-primary">
              {summary.reputationScore} / 10
            </p>
            <div className="space-y-2">
              <p className="text-sm leading-7 text-muted">{summary.reputationPercentile}</p>
              <div className="h-[6px] bg-background">
                <div className="h-full bg-primary-gradient" style={{ width: reputationProgress }} />
              </div>
            </div>
          </article>

          <article className="space-y-4 bg-surface-high p-6">
            <p className="bf-label">AVG. AI SCORE</p>
            <p className="bf-data text-[2.3rem] text-foreground">{summary.averageAiScore}</p>
            <p className="text-sm leading-7 text-primary">{summary.averageAiScoreDelta}</p>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <section className="space-y-5 bg-surface-high p-6">
            <div className="space-y-2">
              <p className="bf-label text-primary">RESEARCHER CONTROL PANEL</p>
              <h2 className="bf-display text-[1.45rem] leading-none tracking-tightHeading">
                QUICK ACCESS
              </h2>
            </div>

            <div className="grid gap-4">
              <Link href="/bounties" className="group bg-background p-5 transition-colors duration-150 hover:bg-surface-low">
                <p className="bf-label text-primary">BROWSE PROGRAMS</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Explore active bounty lists, sort by reward, and submit a new finding.
                </p>
              </Link>

              <Link href="/leaderboard" className="group bg-background p-5 transition-colors duration-150 hover:bg-surface-low">
                <p className="bf-label text-primary">GLOBAL LEADERBOARD</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Track top researchers, payouts, severity depth, and reputation movement.
                </p>
              </Link>

              <Link href="/auth" className="group bg-background p-5 transition-colors duration-150 hover:bg-surface-low">
                <p className="bf-label text-primary">ACCOUNT ACCESS</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Switch session, verify access, or return to the role-based authentication flow.
                </p>
              </Link>
            </div>
          </section>

          <section className="space-y-5 bg-surface-high p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="bf-label text-primary">ACTIVE PROGRAMS</p>
                <h2 className="bf-display text-[1.45rem] leading-none tracking-tightHeading">
                  BOUNTY LIST SNAPSHOT
                </h2>
              </div>
              <Link href="/bounties" className="bf-button-tertiary">
                VIEW ALL
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {featuredBounties.map((item) => (
                <BountyCard
                  key={item.id}
                  slug={item.slug}
                  title={item.title}
                  platform={item.platform}
                  rewardPool={item.rewardPool}
                  tiers={item.tags}
                  submissionCount={item.submissionCount}
                  status={item.status}
                  severity={item.severity}
                  description={item.shortDescription}
                  ctaLabel="VIEW BOUNTY"
                  compact
                />
              ))}
            </div>
          </section>
        </div>

        <section className="space-y-8">
          <div className="space-y-3">
            <h2 className="bf-display text-[1.5rem] leading-none tracking-tightHeading">
              MY SUBMISSIONS
            </h2>
            <div className="flex flex-wrap gap-6 border-b border-outline-variant/15 pb-3">
              {filters.map((filterValue) => (
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
          </div>

          <div className="overflow-x-auto bg-surface-low">
            <table className="min-w-[980px] border-collapse">
              <thead>
                <tr className="bg-surface-high text-left">
                  {["BOUNTY", "TITLE", "SUBMITTED", "AI SCORE", "STATUS", "PAYOUT", "ACTION"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 font-mono text-[0.72rem] uppercase tracking-label text-muted"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleSubmissions.length ? (
                  visibleSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className={`transition-colors duration-100 ease-linear hover:bg-surface-high ${
                        submission.status === "PAID" ? "border-l-[3px] border-primary" : ""
                      }`}
                    >
                      <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.86rem] text-foreground">
                        {submission.bountyName}
                      </td>
                      <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.86rem] text-foreground">
                        {submission.title}
                      </td>
                      <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.82rem] text-muted">
                        {submission.submittedAt}
                      </td>
                      <td
                        className={`border-b border-outline-variant/15 px-5 py-5 font-data text-[0.92rem] ${getScoreTone(
                          submission.aiScore
                        )}`}
                      >
                        {submission.aiScore > 0 ? submission.aiScore.toFixed(1) : "--"}
                      </td>
                      <td className="border-b border-outline-variant/15 px-5 py-5">
                        <div className="space-y-2">
                          <StatusChip status={submission.status} />
                          {submission.responseEta ? (
                            <p className="bf-label text-muted">{submission.responseEta}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.88rem] text-primary">
                        {submission.payout > 0 ? `${formatCurrency(submission.payout, 0)} USDT` : "--"}
                      </td>
                      <td className="border-b border-outline-variant/15 px-5 py-5">
                        <Link
                          href={`/dashboard/submission/${submission.id}`}
                          className="font-mono text-[0.78rem] uppercase tracking-label text-primary transition-colors duration-100 ease-linear hover:text-primary-fixed"
                        >
                          {getActionLabel(submission)}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center font-mono text-sm text-muted">
                      No submissions match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="bf-label text-primary">GLOBAL RESEARCHERS</p>
              <h2 className="bf-display text-[1.5rem] leading-none tracking-tightHeading">
                LEADERBOARD PREVIEW
              </h2>
            </div>
            <Link href="/leaderboard" className="bf-button-tertiary">
              OPEN FULL LEADERBOARD
            </Link>
          </div>

          <div className="overflow-x-auto bg-surface-low">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-surface-high text-left">
                  {["RANK", "RESEARCHER", "FINDINGS", "PAID OUT", "REP SCORE"].map((heading) => (
                    <th
                      key={heading}
                      className={`px-5 py-4 font-mono text-[0.72rem] uppercase tracking-label text-muted ${
                        heading === "FINDINGS" || heading === "REP SCORE" ? "text-center" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboardPreview.map((row) => (
                  <tr key={row.rank} className="transition-colors duration-100 ease-linear hover:bg-surface-high">
                    <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.86rem] text-primary">
                      {row.rank}
                    </td>
                    <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.86rem] text-foreground">
                      {row.researcher}
                    </td>
                    <td className="border-b border-outline-variant/15 px-5 py-5 text-center font-data text-[0.86rem] text-muted">
                      {row.findings}
                    </td>
                    <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.86rem] text-primary">
                      {formatCurrency(row.paidOut, 0)} USDT
                    </td>
                    <td className="border-b border-outline-variant/15 px-5 py-5 text-center font-data text-[0.86rem] text-foreground">
                      {row.repScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-8 xl:items-start xl:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-8">
            <div className="space-y-3">
              <h2 className="bf-display text-[1.5rem] leading-none tracking-tightHeading">
                PAYOUT HISTORY
              </h2>
              <p className="text-sm leading-7 text-muted">
                ALL ON-CHAIN TRANSACTIONS. VERIFIABLE FOREVER.
              </p>
            </div>

            <div className="relative space-y-6 pl-7 before:absolute before:bottom-0 before:left-1 before:top-1 before:w-[2px] before:bg-primary/30">
              {payoutHistory.map((entry) => (
                <article key={entry.id} className="relative bg-surface-high p-5">
                  <span className="absolute -left-[1.9rem] top-7 h-3 w-3 bg-primary" />
                  <div className="space-y-3">
                    <p className="bf-data text-[0.82rem] text-muted">{entry.occurredAt}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="bf-data text-[1.5rem] text-primary">
                        {formatCurrency(entry.amount, 0)} USDT
                      </p>
                      <StatusChip status="CONFIRMED" />
                    </div>
                    <p className="text-sm leading-7 text-foreground">{entry.bountyName}</p>
                    <p className="bf-label text-primary">TX HASH: {entry.txHash}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="bf-data pl-7 text-[1rem] text-primary">
              TOTAL RECEIVED: {formatCurrency(totalReceived, 0)} USDT
            </p>
          </section>

          <section className="self-start space-y-6 bg-surface-high p-7 md:p-8 xl:mt-[5.55rem]">
            <div className="border-l-[3px] border-indigo pl-5">
              <p className="bf-label text-primary">RESEARCHER REPUTATION</p>
              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="bf-display text-[2.6rem] leading-none tracking-tightHeading text-primary">
                    {reputationBreakdown.currentScore} / 10
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {reputationBreakdown.percentile}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {reputationBreakdown.metrics.map((metric) => (
                <div key={metric.label} className="bg-background p-5">
                  <p className="bf-label">{metric.label}</p>
                  <p className="bf-data mt-3 text-[1.35rem] text-foreground">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusChip status={reputationBreakdown.unlockedTier} />
              <span className="inline-flex items-center gap-2 border border-outline/20 px-3 py-2 font-mono text-[0.68rem] uppercase tracking-label text-muted">
                <span aria-hidden="true">LOCK</span>
                {reputationBreakdown.nextTier}
              </span>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
