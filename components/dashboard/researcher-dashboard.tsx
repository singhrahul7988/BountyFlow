"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { bounties } from "@/lib/bounty-data";
import {
  type DashboardSummary,
  type PayoutHistoryEntry,
  type ResearcherSubmission,
  reputationBreakdown
} from "@/lib/dashboard-data";
import { leaderboardRows } from "@/lib/mock-data";
import { signOutBrowserSession } from "@/lib/supabase/browser-sign-out";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { useAppStore } from "@/lib/stores/app-store";
import { cn, formatCurrency, truncateAddress } from "@/lib/utils";
import { Logo } from "../home/logo";
import { StatusChip } from "../home/status-chip";
import { WalletLinkButton } from "../wallet/wallet-link-button";

const views = ["OVERVIEW", "MY SUBMISSIONS", "PAYOUT HISTORY", "LEADERBOARD"] as const;
const filters = ["ALL", "ACTIVE", "UNDER REVIEW", "RESOLVED", "REJECTED"] as const;

type DashboardView = (typeof views)[number];

function getFilterBucket(status: ResearcherSubmission["status"]) {
  if (status === "DRAFT" || status === "SUBMITTED" || status === "AI SCORING") {
    return "ACTIVE";
  }

  if (
    status === "AI SCORED" ||
    status === "UNDER REVIEW" ||
    status === "DISPUTE WINDOW" ||
    status === "DISPUTE OPEN" ||
    status === "FIX IN PROGRESS"
  ) {
    return "UNDER REVIEW";
  }

  if (status === "REJECTED") {
    return "REJECTED";
  }

  return "RESOLVED";
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

function getSubmissionStatusLine(submission: ResearcherSubmission) {
  if (submission.status === "PAID") {
    return submission.txHash ? `TX ${submission.txHash}` : "SETTLED ON-CHAIN";
  }

  if (submission.responseEta) {
    return submission.responseEta;
  }

  if (submission.status === "DRAFT") {
    return "LOCAL DRAFT";
  }

  return "ACTIVE PIPELINE";
}

function DashboardStatCard({
  label,
  value,
  subline,
  accent = "primary"
}: {
  label: string;
  value: string;
  subline: string;
  accent?: "primary" | "indigo" | "foreground";
}) {
  return (
    <article className="border border-outline/12 bg-surface-high/80 p-6 backdrop-blur-sm">
      <p className="bf-label text-muted">{label}</p>
      <p
        className={cn(
          "bf-data mt-5 text-[2.2rem] leading-none sm:text-[2.55rem]",
          accent === "primary"
            ? "text-primary"
            : accent === "indigo"
              ? "text-indigo"
              : "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="mt-4 text-sm leading-7 text-muted">{subline}</p>
    </article>
  );
}

function DashboardPanel({
  eyebrow,
  title,
  action,
  children,
  className
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border border-outline/12 bg-surface-high/75 p-6 backdrop-blur-sm md:p-7",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? <p className="bf-label text-primary">{eyebrow}</p> : null}
          <h2 className="bf-display text-[1.45rem] leading-none tracking-tightHeading sm:text-[1.75rem]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ViewNavButton({
  view,
  activeView,
  onClick,
  count
}: {
  view: DashboardView;
  activeView: DashboardView;
  onClick: (view: DashboardView) => void;
  count?: number;
}) {
  const isActive = view === activeView;

  return (
    <button
      type="button"
      onClick={() => onClick(view)}
      className={cn(
        "flex items-center justify-between gap-3 border-l-[3px] px-4 py-3 text-left transition-colors duration-150",
        isActive
          ? "border-primary bg-primary/8 text-primary"
          : "border-transparent text-muted hover:bg-surface-high/70 hover:text-foreground"
      )}
    >
      <span className="font-mono text-[0.78rem] uppercase tracking-label">{view}</span>
      {count ? (
        <span className="bg-background px-2 py-1 font-data text-[0.7rem] text-foreground">
          {count}
        </span>
      ) : null}
    </button>
  );
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
  const [activeView, setActiveView] = useState<DashboardView>("OVERVIEW");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionSeconds, setSessionSeconds] = useState(15164);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
  const { currentUser, hasHydrated, signOut } = useAppStore();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSessionSeconds((currentValue) => currentValue + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const activePrograms = useMemo(() => bounties.slice(0, 3), []);
  const leaderboardPreview = useMemo(() => leaderboardRows.slice(0, 7), []);
  const totalReceived = useMemo(
    () => payoutHistory.reduce((total, entry) => total + entry.amount, 0),
    [payoutHistory]
  );
  const pendingEscrow = useMemo(
    () =>
      submissions
        .filter((submission) =>
          ["UNDER REVIEW", "AI SCORED", "AI SCORING", "DISPUTE WINDOW", "DISPUTE OPEN"].includes(
            submission.status
          )
        )
        .reduce((total, submission) => total + submission.payout, 0),
    [submissions]
  );
  const activeAuditCount = useMemo(
    () =>
      submissions.filter((submission) =>
        ["SUBMITTED", "AI SCORING", "AI SCORED", "UNDER REVIEW", "FIX IN PROGRESS"].includes(
          submission.status
        )
      ).length,
    [submissions]
  );
  const criticalCount = useMemo(
    () => submissions.filter((submission) => submission.severity === "CRITICAL").length,
    [submissions]
  );
  const liveRank = useMemo(() => {
    const percentileMatch = summary.reputationPercentile.match(/\d+/);
    return percentileMatch ? `#${percentileMatch[0]}` : "#12";
  }, [summary.reputationPercentile]);
  const trendBars = useMemo(() => {
    const baseValues = [48, 62, 58, 74, 69, 83, 77, 92];
    return baseValues.map((value, index) => ({
      label: `W${index + 1}`,
      verified: value,
      processed: Math.max(32, value - 14)
    }));
  }, []);
  const networkStatus = currentUser?.walletLinked ? "LIVE SETTLEMENT READY" : "PAYOUT WALLET REQUIRED";
  const totalBountyPool = useMemo(
    () => activePrograms.reduce((total, bounty) => total + bounty.rewardPool, 0),
    [activePrograms]
  );
  const aggregateFindings = useMemo(
    () => leaderboardRows.reduce((total, row) => total + row.findings, 0),
    []
  );
  const topLeaderboardSeverity = leaderboardPreview[0]?.topSeverity ?? "HIGH";

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

  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesFilter =
        activeFilter === "ALL" || getFilterBucket(submission.status) === activeFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [submission.id, submission.bountyName, submission.title, submission.severity].some(
        (value) => value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeFilter, searchQuery, submissions]);

  const recentSubmissions = useMemo(() => submissions.slice(0, 4), [submissions]);

  const sessionClock = useMemo(() => {
    const hours = String(Math.floor(sessionSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((sessionSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(sessionSeconds % 60).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }, [sessionSeconds]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    signOut();
    await signOutBrowserSession(supabase);
    setIsLoggingOut(false);
  }

  function renderOverview() {
    return (
      <div className="space-y-8">
        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="relative overflow-hidden border border-outline/12 bg-surface-high/75 p-7 backdrop-blur-sm md:p-9">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(99,255,205,0.04)_100%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, rgba(99,255,205,0.06) 0, rgba(99,255,205,0.06) 1px, transparent 1px, transparent 5px)"
              }}
            />
            <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-5">
                <p className="bf-label text-primary">AUTHENTICATED // OPERATIONAL</p>
                <h1 className="bf-display max-w-[8ch] text-[3.25rem] leading-[0.92] tracking-tightHeading sm:text-[4.6rem]">
                  RESEARCHER OVERVIEW
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted">
                  Monitor submission velocity, reputation movement, live payout readiness, and
                  active bounty opportunities from one console.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/bounties" className="bf-button-primary">
                    SUBMIT ENTRY
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveView("MY SUBMISSIONS")}
                    className="bf-button-secondary"
                  >
                    OPEN MY SUBMISSIONS
                  </button>
                </div>
              </div>

              <div className="w-full max-w-[18rem] space-y-4 border-l-[3px] border-primary pl-5">
                <p className="bf-label">CURRENT SESSION</p>
                <p className="bf-data text-[2.15rem] text-foreground">{sessionClock}</p>
                <div className="space-y-2 text-sm leading-7 text-muted">
                  <p>USER_ID: {currentUser ? truncateAddress(currentUser.id) : "AUTHENTICATED"}</p>
                  <p>{networkStatus}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <DashboardStatCard
              label="TOTAL EARNED"
              value={`${formatCurrency(summary.totalEarned, 0)}`}
              subline="USDT released from verified findings and closed dispute windows."
            />
            <DashboardStatCard
              label="REP SCORE"
              value={`${summary.reputationScore} / 10`}
              subline={summary.reputationPercentile}
              accent="foreground"
            />
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="SUBMISSIONS"
            value={String(summary.submissions)}
            subline={`${summary.active} ACTIVE / ${summary.review} IN REVIEW / ${summary.resolved} CLOSED`}
            accent="foreground"
          />
          <DashboardStatCard
            label="AVG AI SCORE"
            value={summary.averageAiScore.toFixed(1)}
            subline={summary.averageAiScoreDelta}
            accent="indigo"
          />
          <DashboardStatCard
            label="PENDING ESCROW"
            value={formatCurrency(pendingEscrow, 0)}
            subline={`${activeAuditCount} RESEARCH FLOWS AWAITING FINAL RESOLUTION`}
            accent="indigo"
          />
          <DashboardStatCard
            label="CRITICAL FINDINGS"
            value={String(criticalCount).padStart(2, "0")}
            subline="High-impact reports materially improve rank velocity."
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
          <DashboardPanel eyebrow="CONTROL PANEL" title="RESEARCH OPS">
            <div className="space-y-4">
              <Link
                href="/bounties"
                className="flex items-center justify-between gap-4 bg-background px-5 py-4 transition-colors duration-150 hover:bg-surface-low"
              >
                <span className="bf-data text-[0.95rem] text-foreground">BROWSE PROGRAMS</span>
                <span className="text-primary">-&gt;</span>
              </Link>
              <button
                type="button"
                onClick={() => setActiveView("PAYOUT HISTORY")}
                className="flex w-full items-center justify-between gap-4 bg-background px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-low"
              >
                <span className="bf-data text-[0.95rem] text-foreground">WITHDRAWAL LEDGER</span>
                <span className="text-primary">-&gt;</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("LEADERBOARD")}
                className="flex w-full items-center justify-between gap-4 bg-background px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-low"
              >
                <span className="bf-data text-[0.95rem] text-foreground">GLOBAL LEADERBOARD</span>
                <span className="text-primary">-&gt;</span>
              </button>
            </div>

            <div className="mt-8 grid gap-4 border-t border-outline/12 pt-6 sm:grid-cols-2">
              <div>
                <p className="bf-label">IDENTITY STATUS</p>
                <p className="mt-3 bf-data text-[1.05rem] text-primary">VERIFIED</p>
              </div>
              <div>
                <p className="bf-label">PAYOUT WALLET</p>
                <p className="mt-3 bf-data text-[1.05rem] text-foreground">
                  {currentUser?.walletLinked ? truncateAddress(currentUser.walletAddress) : "NOT LINKED"}
                </p>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="ACTIVE PROGRAMS SNAPSHOT"
            title="TOP BOUNTIES IN RANGE"
            action={
              <Link href="/bounties" className="bf-button-tertiary">
                VIEW ALL BOUNTIES
              </Link>
            }
          >
            <div className="space-y-4">
              {activePrograms.map((bounty) => (
                <article
                  key={bounty.slug}
                  className="grid gap-4 border border-outline/12 bg-background/70 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto_auto]"
                >
                  <div className="space-y-3">
                    <p className="bf-display text-[1.25rem] leading-none tracking-tightHeading text-foreground">
                      {bounty.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bounty.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="bg-surface-high px-2 py-1 font-mono text-[0.62rem] uppercase tracking-label text-indigo"
                        >
                          {tag}
                        </span>
                      ))}
                      <StatusChip status={bounty.acceptedSeverities[0] ?? "HIGH"} />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="bf-label">TOTAL POOL</p>
                    <p className="bf-data text-[1.6rem] text-primary">
                      {formatCurrency(bounty.rewardPool, 0)}
                    </p>
                  </div>
                  <Link
                    href={`/bounty/${bounty.slug}`}
                    className="bf-button-secondary self-center justify-center"
                  >
                    AUDIT
                  </Link>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <DashboardPanel eyebrow="SUBMISSION PULSE" title="RECENT RESEARCH TRAFFIC">
            <div className="grid gap-4 md:grid-cols-2">
              {recentSubmissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/dashboard/submission/${submission.id}`}
                  className="border border-outline/12 bg-background/70 p-5 transition-colors duration-150 hover:bg-surface-low"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="bf-label">{submission.bountyName}</p>
                      <h3 className="bf-data text-[1rem] text-foreground">{submission.title}</h3>
                    </div>
                    <StatusChip status={submission.status} />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className="bf-label text-muted">{getSubmissionStatusLine(submission)}</p>
                    <p className={cn("bf-data text-[1rem]", getScoreTone(submission.aiScore))}>
                      {submission.aiScore > 0 ? submission.aiScore.toFixed(1) : "--"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="REPUTATION MATRIX" title="CURRENT CLEARANCE">
            <div className="space-y-6">
              <div className="border-l-[3px] border-primary pl-4">
                <p className="bf-display text-[2.4rem] leading-none tracking-tightHeading text-primary">
                  {reputationBreakdown.currentScore} / 10
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {reputationBreakdown.percentile}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {reputationBreakdown.metrics.map((metric) => (
                  <div key={metric.label} className="bg-background/75 p-4">
                    <p className="bf-label">{metric.label}</p>
                    <p className="mt-3 bf-data text-[1.2rem] text-foreground">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <StatusChip status={reputationBreakdown.unlockedTier} />
                <span className="border border-outline/15 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-label text-muted">
                  {reputationBreakdown.nextTier}
                </span>
              </div>
            </div>
          </DashboardPanel>
        </section>
      </div>
    );
  }

  function renderSubmissions() {
    return (
      <div className="space-y-8">
        <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4 border border-outline/12 bg-surface-high/75 p-7 backdrop-blur-sm md:p-9">
            <h1 className="bf-display text-[3.15rem] leading-[0.92] tracking-tightHeading sm:text-[4.4rem]">
              MY SUBMISSIONS
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted">
              Immutable ledger of cryptographic audits, AI triage, dispute windows, and verifiable
              payout outcomes.
            </p>
          </div>

          <div className="border border-outline/12 bg-surface-high/75 p-6 backdrop-blur-sm">
            <p className="bf-label">NETWORK STATUS</p>
            <p className="mt-5 bf-data text-[1.85rem] text-primary">{networkStatus}</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {currentUser?.walletLinked
                ? "Wallet-linked researcher profile can receive live settlement."
                : "Link a payout wallet before final live-mode settlement."}
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="TOTAL YIELD"
            value={formatCurrency(totalReceived, 0)}
            subline="+12.4% FROM PREVIOUS EPOCH"
          />
          <DashboardStatCard
            label="PENDING ESCROW"
            value={formatCurrency(pendingEscrow, 0)}
            subline={`${summary.review} DISCLOSURES PENDING`}
            accent="indigo"
          />
          <DashboardStatCard
            label="AVG AI SCORE"
            value={summary.averageAiScore.toFixed(2)}
            subline="ELITE RANGE DETECTED"
            accent="foreground"
          />
          <DashboardStatCard
            label="ACTIVE AUDITS"
            value={String(activeAuditCount)}
            subline="PROCESSING PAYLOAD..."
            accent="foreground"
          />
        </section>

        <DashboardPanel
          eyebrow="SUBMISSION LEDGER"
          title="PIPELINE QUEUE"
          action={
            <div className="w-full max-w-[20rem]">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="FILTER BY BOUNTY ID OR TITLE..."
                className="w-full border border-outline/12 bg-background px-4 py-3 font-mono text-[0.8rem] uppercase tracking-label text-foreground outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
              />
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              {filters.map((filterValue) => (
                <button
                  key={filterValue}
                  type="button"
                  onClick={() => setActiveFilter(filterValue)}
                  className={cn(
                    "px-4 py-3 font-mono text-[0.72rem] uppercase tracking-label transition-colors duration-150",
                    activeFilter === filterValue
                      ? "bg-primary text-background"
                      : "bg-background text-muted hover:text-foreground"
                  )}
                >
                  {filterValue} ({filterCounts[filterValue]})
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-outline/12 bg-background/75 text-left">
                    {["BOUNTY", "TITLE", "SUBMITTED DATE", "AI SCORE", "STATUS", "PAYOUT", "ACTION"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 font-mono text-[0.7rem] uppercase tracking-label text-muted"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length ? (
                    filteredSubmissions.map((submission) => (
                      <tr
                        key={submission.id}
                        className="border-b border-outline/10 transition-colors duration-150 hover:bg-background/65"
                      >
                        <td className="px-5 py-5 font-data text-[0.92rem] text-foreground">
                          {submission.bountyName}
                        </td>
                        <td className="px-5 py-5 font-data text-[0.92rem] text-foreground">
                          {submission.title}
                        </td>
                        <td className="px-5 py-5 font-data text-[0.82rem] text-muted">
                          {submission.submittedAt}
                        </td>
                        <td className={cn("px-5 py-5 font-data text-[1rem]", getScoreTone(submission.aiScore))}>
                          {submission.aiScore > 0 ? submission.aiScore.toFixed(2) : "--"}
                        </td>
                        <td className="px-5 py-5">
                          <StatusChip status={submission.status} />
                        </td>
                        <td className="px-5 py-5 font-data text-[0.95rem] text-primary">
                          {submission.payout > 0 ? formatCurrency(submission.payout, 0) : "--"}
                        </td>
                        <td className="px-5 py-5">
                          <Link
                            href={`/dashboard/submission/${submission.id}`}
                            className="font-mono text-[0.74rem] uppercase tracking-label text-primary transition-colors duration-150 hover:text-primary-fixed"
                          >
                            {getActionLabel(submission)}
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center font-mono text-sm text-muted">
                        No submissions match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DashboardPanel>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <DashboardPanel eyebrow="SUBMISSION TRENDS" title="VERIFIED VS PROCESSED">
            <div className="grid grid-cols-8 items-end gap-3">
              {trendBars.map((bar) => (
                <div key={bar.label} className="space-y-3">
                  <div className="flex h-52 items-end justify-center gap-1">
                    <div className="w-5 bg-surface-low" style={{ height: `${bar.processed}%` }} />
                    <div className="w-5 bg-primary" style={{ height: `${bar.verified}%` }} />
                  </div>
                  <p className="text-center font-mono text-[0.68rem] uppercase tracking-label text-muted">
                    {bar.label}
                  </p>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="PIPELINE THROUGHPUT" title="NODE EFFICIENCY">
            <div className="flex flex-col items-center justify-center gap-8 text-center">
              <div
                className="flex h-52 w-52 items-center justify-center rounded-full"
                style={{
                  background:
                    "conic-gradient(rgb(99,255,205) 0deg, rgb(99,255,205) 316deg, rgba(255,255,255,0.08) 316deg 360deg)"
                }}
              >
                <div className="flex h-[10.6rem] w-[10.6rem] flex-col items-center justify-center rounded-full bg-background">
                  <p className="bf-data text-[2.6rem] text-foreground">88%</p>
                  <p className="bf-label text-muted">EFFICIENCY</p>
                </div>
              </div>

              <div className="grid w-full gap-4 border-t border-outline/12 pt-5 text-left">
                <div className="flex items-center justify-between gap-3">
                  <span className="bf-label">VERIFICATION NODE 1</span>
                  <span className="bf-data text-[0.92rem] text-primary">OPERATIONAL</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="bf-label">LATENCY THRESHOLD</span>
                  <span className="bf-data text-[0.92rem] text-foreground">42MS</span>
                </div>
              </div>
            </div>
          </DashboardPanel>
        </section>
      </div>
    );
  }

  function renderPayoutHistory() {
    return (
      <div className="space-y-8">
        <section className="space-y-4 border border-outline/12 bg-surface-high/75 p-7 backdrop-blur-sm md:p-9">
          <p className="bf-label text-primary">VERIFIABLE ON-CHAIN TRANSACTIONS</p>
          <h1 className="bf-display text-[3.2rem] leading-[0.92] tracking-tightHeading sm:text-[4.6rem]">
            PAYOUT HISTORY
          </h1>
          <p className="max-w-3xl text-base leading-8 text-muted">
            Every released payout, dispute closure, and treasury-backed settlement is visible in the
            same immutable ledger.
          </p>
        </section>

        <div className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-[2px] before:bg-primary/25">
          {payoutHistory.map((entry) => (
            <article
              key={entry.id}
              className="relative grid gap-5 border border-outline/12 bg-surface-high/75 px-6 py-6 backdrop-blur-sm lg:grid-cols-[1fr_auto]"
            >
              <span className="absolute -left-[1.15rem] top-8 h-3 w-3 bg-primary" />
              <div className="space-y-3">
                <p className="bf-data text-[0.84rem] text-muted">{entry.occurredAt}</p>
                <h2 className="bf-display text-[1.5rem] leading-none tracking-tightHeading text-foreground">
                  {entry.bountyName}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="border border-indigo/25 bg-indigo/15 px-3 py-2 font-mono text-[0.7rem] text-indigo">
                    TX: {entry.txHash}
                  </span>
                  <StatusChip status="CONFIRMED" pulsing />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <p className="bf-data text-[2.2rem] text-primary">
                  +{formatCurrency(entry.amount, 0)} USDT
                </p>
                <p className="bf-label text-muted">
                  {entry.isCritical ? "IMPACT: CRITICAL" : "PROTOCOL REWARD SETTLED"}
                </p>
              </div>
            </article>
          ))}
        </div>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <DashboardPanel eyebrow="AGGREGATE EARNINGS (FY26)" title="TOTAL RECEIVED">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="bf-display text-[3rem] leading-[0.92] tracking-tightHeading text-foreground sm:text-[4rem]">
                  {formatCurrency(totalReceived, 0)}
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  Verifiable settlement volume routed to your linked sovereign wallet.
                </p>
              </div>
              <button type="button" className="bf-button-primary justify-center">
                EXPORT REPORTS.PDF
              </button>
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="WALLET STATUS" title="RECEIVING ADDRESS">
            <div className="space-y-4">
              <p className="bf-data text-[1.15rem] text-foreground">
                {currentUser?.walletLinked ? truncateAddress(currentUser.walletAddress) : "WALLET NOT LINKED"}
              </p>
              <WalletLinkButton
                className="w-full justify-center"
                showHelperText={false}
                showInlineFeedback={false}
              />
            </div>
          </DashboardPanel>
        </section>
      </div>
    );
  }

  function renderLeaderboard() {
    return (
      <div className="space-y-8">
        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4 border border-outline/12 bg-surface-high/75 p-7 backdrop-blur-sm md:p-9">
            <p className="bf-label text-primary">GLOBAL ECOSYSTEM</p>
            <h1 className="bf-display text-[3.15rem] leading-[0.92] tracking-tightHeading sm:text-[4.6rem]">
              GLOBAL LEADERBOARD
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end">
            <button type="button" className="bg-primary px-5 py-4 font-mono text-[0.72rem] uppercase tracking-label text-background">
              SOVEREIGN TIER
            </button>
            <button type="button" className="bg-surface-high px-5 py-4 font-mono text-[0.72rem] uppercase tracking-label text-foreground">
              SHADOW NODE
            </button>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="TOTAL BOUNTY POOL"
            value={formatCurrency(totalBountyPool, 0)}
            subline="Actively surfaced programs from the public audit feed."
          />
          <DashboardStatCard
            label="ACTIVE AUDITORS"
            value={String(leaderboardRows.length)}
            subline="Researchers with verified findings in the current cycle."
            accent="foreground"
          />
          <DashboardStatCard
            label="VULNERABILITIES PATCHED"
            value={String(aggregateFindings)}
            subline="Represents total validated findings across the current board."
            accent="foreground"
          />
          <DashboardStatCard
            label="TOP SEVERITY"
            value={topLeaderboardSeverity}
            subline="Current board leader set by maximum validated impact."
          />
        </section>

        <DashboardPanel title="RANKED RESEARCHERS">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-outline/12 bg-background/75 text-left">
                  {["RANK", "RESEARCHER", "TOTAL FINDINGS", "TOTAL EARNINGS", "REP SCORE", "TOP SEVERITY"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 font-mono text-[0.7rem] uppercase tracking-label text-muted"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {leaderboardPreview.map((row) => (
                  <tr
                    key={row.rank}
                    className="border-b border-outline/10 transition-colors duration-150 hover:bg-background/65"
                  >
                    <td className="px-5 py-5 font-data text-[0.92rem] text-primary">{row.rank}</td>
                    <td className="px-5 py-5 font-data text-[0.92rem] text-foreground">
                      {row.researcher}
                    </td>
                    <td className="px-5 py-5 font-data text-[0.92rem] text-foreground">{row.findings}</td>
                    <td className="px-5 py-5 font-data text-[0.92rem] text-primary">
                      {formatCurrency(row.paidOut, 0)}
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <span className="font-data text-[0.92rem] text-foreground">{row.repScore}</span>
                        <div className="h-[6px] flex-1 bg-background">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(100, row.repScore * 10)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <StatusChip status={row.topSeverity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <DashboardPanel eyebrow="CURRENT STATUS" title={`YOUR RANK: ${liveRank}`}>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <p className="bf-label">REPUTATION</p>
                <p className="mt-3 bf-data text-[2rem] text-primary">{summary.reputationScore}</p>
              </div>
              <div>
                <p className="bf-label">NEXT TIER GOAL</p>
                <p className="mt-3 bf-data text-[1.25rem] text-foreground">+1.4 TO SOVEREIGN</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("OVERVIEW")}
                className="bf-button-secondary h-fit justify-center self-end"
              >
                BOOST SCORE
              </button>
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="PERSONAL POSITIONING" title="RESEARCH FOCUS">
            <div className="space-y-4 text-sm leading-7 text-muted">
              <p>
                Critical bounty density remains highest in bridge, oracle, and settlement programs.
              </p>
              <p>
                Raising validated severity depth will move you faster than increasing low-severity volume.
              </p>
            </div>
          </DashboardPanel>
        </section>
      </div>
    );
  }

  const content =
    activeView === "OVERVIEW"
      ? renderOverview()
      : activeView === "MY SUBMISSIONS"
        ? renderSubmissions()
        : activeView === "PAYOUT HISTORY"
          ? renderPayoutHistory()
          : renderLeaderboard();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "96px 96px"
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(99,255,205,0.05) 0, rgba(99,255,205,0.05) 1px, transparent 1px, transparent 6px)"
        }}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/3 top-16 h-[34rem] w-[34rem] rounded-full bg-primary/8 blur-[130px]"
      />

      <div className="relative min-h-screen lg:grid lg:grid-cols-[18.5rem_minmax(0,1fr)]">
        <aside className="border-b border-outline/12 bg-surface-low/85 backdrop-blur-sm lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-6 p-5">
            <Link href="/" className="inline-flex">
              <Logo />
            </Link>

            <div className="border border-outline/12 bg-background/80 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center border border-primary/35 bg-surface-high text-primary">
                  <span className="bf-data text-[1rem]">{currentUser?.name?.slice(0, 2).toUpperCase() ?? "SA"}</span>
                </div>
                <div className="space-y-1">
                  <p className="bf-display text-[1.1rem] leading-none tracking-tightHeading text-foreground">
                    {currentUser?.name?.toUpperCase() ?? "SOVEREIGN AUDITOR"}
                  </p>
                  <p className="bf-label text-primary">RANK: ELITE</p>
                </div>
              </div>
            </div>

            <nav className="grid gap-1.5">
              <ViewNavButton view="OVERVIEW" activeView={activeView} onClick={setActiveView} />
              <ViewNavButton
                view="MY SUBMISSIONS"
                activeView={activeView}
                onClick={setActiveView}
                count={summary.submissions}
              />
              <ViewNavButton
                view="PAYOUT HISTORY"
                activeView={activeView}
                onClick={setActiveView}
                count={payoutHistory.length}
              />
              <ViewNavButton view="LEADERBOARD" activeView={activeView} onClick={setActiveView} />
            </nav>

            <div className="mt-auto space-y-4">
              <Link href="/bounties" className="bf-button-primary w-full justify-center">
                SUBMIT ENTRY
              </Link>

              <div className="grid gap-2 border border-outline/12 bg-background/80 p-4">
                <Link
                  href="/docs"
                  className="font-mono text-[0.72rem] uppercase tracking-label text-muted transition-colors duration-150 hover:text-foreground"
                >
                  DOCUMENTATION
                </Link>
                <Link
                  href="/auth"
                  className="font-mono text-[0.72rem] uppercase tracking-label text-muted transition-colors duration-150 hover:text-foreground"
                >
                  ACCOUNT ACCESS
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="border-b border-outline/12 bg-background/85 px-5 py-4 backdrop-blur-sm md:px-7 lg:px-9">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {views.map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setActiveView(view)}
                    className={cn(
                      "border-b-2 px-3 py-2 font-mono text-[0.8rem] uppercase tracking-label transition-colors duration-150",
                      activeView === view
                        ? "border-primary text-primary"
                        : "border-transparent text-muted hover:text-foreground"
                    )}
                  >
                    {view}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="border border-outline/12 bg-surface-high px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 animate-pulse-dot bg-primary" />
                    <span className="bf-label text-primary">
                      {hasHydrated && currentUser ? "AUTHENTICATED // OPERATIONAL" : "SYNCING SESSION"}
                    </span>
                  </div>
                </div>

                <WalletLinkButton
                  className="min-w-[12rem] justify-center"
                  showHelperText={false}
                  showInlineFeedback={false}
                />

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bf-button-secondary justify-center"
                >
                  {isLoggingOut ? "LOGGING OUT..." : "LOG OUT"}
                </button>
              </div>
            </div>
          </header>

          <div className="px-5 py-6 md:px-7 md:py-8 lg:px-9 lg:py-9">{content}</div>
        </main>
      </div>
    </div>
  );
}
