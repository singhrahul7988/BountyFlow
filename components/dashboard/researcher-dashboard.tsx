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
type UtilityPage = "Terminal" | "Nodes" | "Security";

const dashboardNav = [
  {
    view: "OVERVIEW" as const,
    label: "OVERVIEW",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 2H7V7H2z" />
        <path d="M9 2H14V7H9z" />
        <path d="M2 9H7V14H2z" />
        <path d="M9 9H14V14H9z" />
      </svg>
    )
  },
  {
    view: "MY SUBMISSIONS" as const,
    label: "SUBMISSIONS",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M4 2.5H10.5L13 5V13.5H4z" />
        <path d="M10 2.5V5.5H13" />
        <path d="M6 8H11" />
        <path d="M6 10.5H11" />
      </svg>
    )
  },
  {
    view: "PAYOUT HISTORY" as const,
    label: "PAYOUTS",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2.5 4.5H13.5V11.5H2.5z" />
        <path d="M11.5 8H13.5" />
        <path d="M4.5 6.5H8.5" />
      </svg>
    )
  },
  {
    view: "LEADERBOARD" as const,
    label: "LEADERBOARD",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 13V8" />
        <path d="M8 13V3" />
        <path d="M13 13V6" />
      </svg>
    )
  }
];

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
    <article className="border border-outline/12 bg-surface-high/80 p-2 backdrop-blur-sm">
      <p className="bf-label text-[0.5rem] text-foreground">{label}</p>
      <p
        className={cn(
          "bf-data mt-1.5 text-[0.96rem] leading-none sm:text-[1.08rem]",
          accent === "primary"
            ? "text-primary"
            : accent === "indigo"
              ? "text-indigo"
              : "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[0.62rem] leading-5 text-muted">{subline}</p>
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
        "border border-outline/12 bg-surface-high/75 p-2.5 backdrop-blur-sm md:p-3",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {eyebrow ? <p className="bf-label text-primary">{eyebrow}</p> : null}
          <h2 className="bf-display break-words text-[0.72rem] leading-none tracking-tightHeading sm:text-[0.82rem]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function ViewNavButton({
  view,
  label,
  activeView,
  onClick,
  icon,
  count
}: {
  view: DashboardView;
  label: string;
  activeView: DashboardView;
  onClick: (view: DashboardView) => void;
  icon: React.ReactNode;
  count?: number;
}) {
  const isActive = view === activeView;

  return (
    <button
      type="button"
      onClick={() => onClick(view)}
      className={cn(
        "grid grid-cols-[0.7rem_minmax(0,1fr)_auto] items-center gap-2 border-l-[3px] px-2.5 py-1.5 text-left transition-colors duration-150",
        isActive
          ? "border-primary bg-primary/8 text-primary"
          : "border-transparent text-muted hover:bg-surface-high/70 hover:text-foreground"
      )}
    >
      <span className="flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3">{icon}</span>
      <span className="font-mono text-[0.41rem] uppercase tracking-label">{label}</span>
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
  payoutHistory,
  utilityPage = null
}: {
  submissions: ResearcherSubmission[];
  summary: DashboardSummary;
  payoutHistory: PayoutHistoryEntry[];
  utilityPage?: UtilityPage | null;
}) {
  const [activeView, setActiveView] = useState<DashboardView>("OVERVIEW");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastKnownName, setLastKnownName] = useState("");
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
  const { currentUser, hasHydrated, signOut } = useAppStore();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSessionSeconds((currentValue) => currentValue + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser?.name?.trim()) {
      setLastKnownName(currentUser.name.trim());
    }
  }, [currentUser?.name]);

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
  const profileDisplayName = (currentUser?.name?.trim() || lastKnownName || "ACCOUNT").toUpperCase();
  const sessionStatusLabel = isLoggingOut
    ? "SIGNING OUT"
    : hasHydrated && currentUser
      ? "AUTHENTICATED // OPERATIONAL"
      : "SYNCING SESSION";
  const notificationItems = useMemo(
    () => [
      {
        id: "notif-1",
        label: "LATEST SUBMISSION ENTERED REVIEW",
        detail: submissions[0]?.title ?? "PIPELINE UPDATE"
      },
      {
        id: "notif-2",
        label: "PAYOUT TRANSACTION CONFIRMED",
        detail: payoutHistory[0]?.txHash ?? "TX HASH PENDING"
      },
      {
        id: "notif-3",
        label: "REPUTATION SCORE REFRESHED",
        detail: `${summary.reputationScore} / 10 GLOBAL SCORE`
      }
    ],
    [payoutHistory, submissions, summary.reputationScore]
  );

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
      <div className="space-y-3">
        <section className="relative overflow-hidden border-y border-outline/8 py-4">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(180deg, rgba(99,255,205,0.06) 0, rgba(99,255,205,0.06) 1px, transparent 1px, transparent 5px)"
            }}
          />
          <div className="relative grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="space-y-2.5">
              <h1 className="bf-display max-w-[7.5ch] text-[1.32rem] leading-[0.9] tracking-tightHeading sm:text-[1.52rem]">
                RESEARCHER OVERVIEW
              </h1>
              <p className="bf-data text-[0.66rem] text-primary">
                USER_ID: {currentUser ? `${truncateAddress(currentUser.id)}_AUDIT_LOG_STREAMING...` : "AUTHENTICATED"}
              </p>
            </div>

            <div className="w-full max-w-[6.25rem] border-l-[3px] border-primary bg-surface-high/45 px-2 py-1.5">
              <p className="bf-label">CURRENT SESSION</p>
              <p className="mt-1 bf-data text-[0.82rem] text-foreground">{sessionClock}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="SUBMISSIONS"
            value={String(summary.submissions)}
            subline={`${summary.active} ACTIVE / ${summary.review} IN REVIEW / ${summary.resolved} CLOSED`}
            accent="primary"
          />
          <DashboardStatCard
            label="AVG AI SCORE"
            value={summary.averageAiScore.toFixed(1)}
            subline={summary.averageAiScoreDelta}
            accent="primary"
          />
          <DashboardStatCard
            label="PENDING ESCROW"
            value={formatCurrency(pendingEscrow, 0)}
            subline={`${activeAuditCount} RESEARCH FLOWS AWAITING FINAL RESOLUTION`}
            accent="primary"
          />
          <DashboardStatCard
            label="CRITICAL FINDINGS"
            value={String(criticalCount).padStart(2, "0")}
            subline="High-impact reports materially improve rank velocity."
          />
        </section>

        <section className="grid gap-2.5 xl:grid-cols-[0.7fr_1.3fr]">
          <DashboardPanel title="CONTROL PANEL" className="min-h-[18rem]">
            <div className="space-y-2.5">
              <Link
                href="/bounties"
                className="flex items-center justify-between gap-3 bg-background px-2.5 py-2 transition-colors duration-150 hover:bg-surface-low"
              >
                <span className="bf-data text-[0.66rem] text-foreground">BROWSE PROGRAMS</span>
                <span className="text-primary">-&gt;</span>
              </Link>
              <button
                type="button"
                onClick={() => setActiveView("PAYOUT HISTORY")}
                className="flex w-full items-center justify-between gap-3 bg-background px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-low"
              >
                <span className="bf-data text-[0.66rem] text-foreground">WITHDRAWAL LEDGER</span>
                <span className="text-primary">-&gt;</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("LEADERBOARD")}
                className="flex w-full items-center justify-between gap-3 bg-background px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-low"
              >
                <span className="bf-data text-[0.66rem] text-foreground">GLOBAL LEADERBOARD</span>
                <span className="text-primary">-&gt;</span>
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="bf-label">IDENTITY STATUS</p>
                <p className="bf-data text-[0.68rem] text-primary">VERIFIED</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="bf-label">SECURITY LEVEL</p>
                <p className="bf-data text-[0.68rem] text-primary">LEVEL 4 CLEARANCE</p>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="ACTIVE PROGRAMS SNAPSHOT"
            action={
              <Link href="/bounties" className="font-mono text-[0.52rem] uppercase tracking-label text-primary underline-offset-4 hover:underline">
                VIEW ALL BOUNTIES
              </Link>
            }
          >
            <div className="space-y-2.5">
              {activePrograms.slice(0, 2).map((bounty) => (
                <article
                  key={bounty.slug}
                  className="grid gap-2.5 border border-outline/12 bg-background/70 px-2.5 py-2.5 lg:grid-cols-[2.7rem_minmax(0,1fr)_auto_auto]"
                >
                  <div className="h-[2.7rem] w-[2.7rem] bg-surface-high" />
                  <div className="space-y-1.5">
                    <p className="bf-display text-[0.66rem] leading-none tracking-tightHeading text-foreground">
                      {bounty.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {bounty.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="bg-surface-high px-1.5 py-1 font-mono text-[0.46rem] uppercase tracking-label text-indigo"
                        >
                          {tag}
                        </span>
                      ))}
                      <StatusChip status={bounty.acceptedSeverities[0] ?? "HIGH"} />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="bf-label">TOTAL POOL</p>
                    <p className="bf-data text-[0.8rem] text-primary">
                      {formatCurrency(bounty.rewardPool, 0)}
                    </p>
                  </div>
                  <Link
                    href={`/bounty/${bounty.slug}`}
                    className="bf-button-secondary self-center justify-center px-2 py-1.5 text-[0.46rem]"
                  >
                    AUDIT
                  </Link>
                </article>
              ))}

              <div className="border border-outline/12 bg-background/55 px-2.5 py-3 text-center font-mono text-[0.46rem] uppercase tracking-label text-muted">
                MORE HIGH-PRIORITY BOUNTIES AVAILABLE...
              </div>
            </div>
          </DashboardPanel>
        </section>
      </div>
    );
  }

  function renderSubmissions() {
    return (
      <div className="space-y-4">
        <section className="grid gap-3 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-2 border border-outline/12 bg-surface-high/75 p-3 backdrop-blur-sm md:p-3.5">
            <h1 className="bf-display text-[1.4rem] leading-[0.92] tracking-tightHeading sm:text-[1.66rem]">
              MY SUBMISSIONS
            </h1>
            <p className="max-w-3xl text-[0.68rem] leading-5 text-muted">
              Immutable ledger of cryptographic audits, AI triage, dispute windows, and verifiable
              payout outcomes.
            </p>
          </div>

          <div className="border border-outline/12 bg-surface-high/75 p-3 backdrop-blur-sm">
            <p className="bf-label">NETWORK STATUS</p>
            <p className="mt-2 bf-data text-[0.88rem] text-primary">{networkStatus}</p>
            <p className="mt-1.5 text-[0.66rem] leading-5 text-muted">
              {currentUser?.walletLinked
                ? "Wallet-linked researcher profile can receive live settlement."
                : "Link a payout wallet before final live-mode settlement."}
            </p>
          </div>
        </section>

        <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="TOTAL YIELD"
            value={formatCurrency(totalReceived, 0)}
            subline="+12.4% FROM PREVIOUS EPOCH"
          />
          <DashboardStatCard
            label="PENDING ESCROW"
            value={formatCurrency(pendingEscrow, 0)}
            subline={`${summary.review} DISCLOSURES PENDING`}
            accent="primary"
          />
          <DashboardStatCard
            label="AVG AI SCORE"
            value={summary.averageAiScore.toFixed(2)}
            subline="ELITE RANGE DETECTED"
            accent="primary"
          />
          <DashboardStatCard
            label="ACTIVE AUDITS"
            value={String(activeAuditCount)}
            subline="PROCESSING PAYLOAD..."
            accent="primary"
          />
        </section>

        <DashboardPanel
          eyebrow="SUBMISSION LEDGER"
          title="PIPELINE QUEUE"
          action={
            <div className="w-full max-w-[14rem]">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="FILTER BY BOUNTY ID OR TITLE..."
                className="w-full border border-outline/12 bg-background px-2.5 py-1.5 font-mono text-[0.58rem] uppercase tracking-label text-foreground outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
              />
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {filters.map((filterValue) => (
                <button
                  key={filterValue}
                  type="button"
                  onClick={() => setActiveFilter(filterValue)}
                  className={cn(
                    "px-2.5 py-1.5 font-mono text-[0.56rem] uppercase tracking-label transition-colors duration-150",
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
              <table className="min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-outline/12 bg-background/75 text-left">
                    {["BOUNTY", "TITLE", "SUBMITTED DATE", "AI SCORE", "STATUS", "PAYOUT", "ACTION"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-3 py-2.5 font-mono text-[0.58rem] uppercase tracking-label text-muted"
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
                        <td className="px-3 py-3 font-data text-[0.76rem] text-foreground">
                          {submission.bountyName}
                        </td>
                        <td className="px-3 py-3 font-data text-[0.76rem] text-foreground">
                          {submission.title}
                        </td>
                        <td className="px-3 py-3 font-data text-[0.68rem] text-muted">
                          {submission.submittedAt}
                        </td>
                        <td className={cn("px-3 py-3 font-data text-[0.76rem]", getScoreTone(submission.aiScore))}>
                          {submission.aiScore > 0 ? submission.aiScore.toFixed(2) : "--"}
                        </td>
                        <td className="px-3 py-3">
                          <StatusChip status={submission.status} />
                        </td>
                        <td className="px-3 py-3 font-data text-[0.76rem] text-primary">
                          {submission.payout > 0 ? formatCurrency(submission.payout, 0) : "--"}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/dashboard/submission/${submission.id}`}
                            className="font-mono text-[0.6rem] uppercase tracking-label text-primary transition-colors duration-150 hover:text-primary-fixed"
                          >
                            {getActionLabel(submission)}
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center font-mono text-[0.7rem] text-muted">
                        No submissions match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Link
                href="/bounties"
                className="bf-button-primary justify-center whitespace-nowrap px-3 py-1.5 text-[0.48rem]"
              >
                SUBMIT BUG
              </Link>
            </div>
          </div>
        </DashboardPanel>

        <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <DashboardPanel eyebrow="SUBMISSION TRENDS" title="VERIFIED VS PROCESSED">
            <div className="grid grid-cols-8 items-end gap-1.5">
              {trendBars.map((bar) => (
                <div key={bar.label} className="space-y-2">
                  <div className="flex h-24 items-end justify-center gap-1">
                    <div className="w-2.5 bg-surface-low" style={{ height: `${bar.processed}%` }} />
                    <div className="w-2.5 bg-primary" style={{ height: `${bar.verified}%` }} />
                  </div>
                  <p className="text-center font-mono text-[0.48rem] uppercase tracking-label text-muted">
                    {bar.label}
                  </p>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="PIPELINE THROUGHPUT" title="NODE EFFICIENCY">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background:
                    "conic-gradient(rgb(99,255,205) 0deg, rgb(99,255,205) 316deg, rgba(255,255,255,0.08) 316deg 360deg)"
                }}
              >
                <div className="flex h-[4.55rem] w-[4.55rem] items-center justify-center rounded-full bg-background">
                  <p className="bf-data text-[1.18rem] text-foreground">88%</p>
                </div>
              </div>

              <div className="grid w-full gap-2.5 border-t border-outline/12 pt-3 text-left">
                <div className="flex items-center justify-between gap-3">
                  <span className="bf-label">VERIFICATION NODE 1</span>
                  <span className="bf-data text-[0.68rem] text-primary">OPERATIONAL</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="bf-label">LATENCY THRESHOLD</span>
                  <span className="bf-data text-[0.68rem] text-foreground">42MS</span>
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
      <div className="space-y-3">
        <section className="space-y-2 border border-outline/12 bg-surface-high/75 p-3 backdrop-blur-sm md:p-3.5">
          <p className="bf-label text-primary">VERIFIABLE ON-CHAIN TRANSACTIONS</p>
          <h1 className="bf-display text-[1.4rem] leading-[0.92] tracking-tightHeading sm:text-[1.68rem]">
            PAYOUT HISTORY
          </h1>
          <p className="max-w-3xl text-[0.68rem] leading-5 text-muted">
            Every released payout, dispute closure, and treasury-backed settlement is visible in the
            same immutable ledger.
          </p>
        </section>

        <div className="relative space-y-2.5 pl-3.5 before:absolute before:bottom-2 before:left-1 before:top-2 before:w-[2px] before:bg-primary/25">
          {payoutHistory.map((entry) => (
            <article
              key={entry.id}
              className="relative grid gap-2.5 border border-outline/12 bg-surface-high/75 px-3 py-3 backdrop-blur-sm lg:grid-cols-[1fr_auto]"
            >
              <span className="absolute -left-[0.82rem] top-5 h-2 w-2 bg-primary" />
              <div className="space-y-1.5">
                <p className="bf-data text-[0.58rem] text-muted">{entry.occurredAt}</p>
                <h2 className="bf-display text-[0.76rem] leading-none tracking-tightHeading text-foreground">
                  {entry.bountyName}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-indigo/25 bg-indigo/15 px-2 py-1 font-mono text-[0.44rem] text-indigo">
                    TX: {entry.txHash}
                  </span>
                  <StatusChip status="CONFIRMED" pulsing />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <p className="bf-data text-[0.98rem] text-primary">
                  +{formatCurrency(entry.amount, 0)} USDT
                </p>
                <p className="bf-label text-muted">
                  {entry.isCritical ? "IMPACT: CRITICAL" : "PROTOCOL REWARD SETTLED"}
                </p>
              </div>
            </article>
          ))}
        </div>

        <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <DashboardPanel eyebrow="AGGREGATE EARNINGS (FY26)" title="TOTAL RECEIVED">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="bf-display text-[1.32rem] leading-[0.92] tracking-tightHeading text-foreground sm:text-[1.6rem]">
                  {formatCurrency(totalReceived, 0)}
                </p>
                <p className="mt-1.5 text-[0.64rem] leading-5 text-muted">
                  Verifiable settlement volume routed to your linked sovereign wallet.
                </p>
              </div>
              <button type="button" className="bf-button-primary justify-center px-2 py-1.5 text-[0.48rem]">
                EXPORT REPORTS.PDF
              </button>
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="WALLET STATUS" title="RECEIVING ADDRESS">
            <div className="space-y-2.5">
              <p className="bf-data text-[0.68rem] text-foreground">
                {currentUser?.walletLinked ? truncateAddress(currentUser.walletAddress) : "WALLET NOT LINKED"}
              </p>
              <WalletLinkButton
                className="w-full justify-center px-2 py-1.5 text-[0.48rem]"
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
      <div className="space-y-3">
        <section className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-2 border border-outline/12 bg-surface-high/75 p-3 backdrop-blur-sm md:p-3.5">
            <p className="bf-label text-primary">GLOBAL ECOSYSTEM</p>
            <h1 className="bf-display text-[1.36rem] leading-[0.92] tracking-tightHeading sm:text-[1.58rem]">
              GLOBAL LEADERBOARD
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end">
            <button type="button" className="bg-primary px-2 py-1.5 font-mono text-[0.48rem] uppercase tracking-label text-background">
              SOVEREIGN TIER
            </button>
            <button type="button" className="bg-surface-high px-2 py-1.5 font-mono text-[0.48rem] uppercase tracking-label text-foreground">
              SHADOW NODE
            </button>
          </div>
        </section>

        <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="TOTAL BOUNTY POOL"
            value={formatCurrency(totalBountyPool, 0)}
            subline="Actively surfaced programs from the public audit feed."
          />
          <DashboardStatCard
            label="ACTIVE AUDITORS"
            value={String(leaderboardRows.length)}
            subline="Researchers with verified findings in the current cycle."
            accent="primary"
          />
          <DashboardStatCard
            label="VULNERABILITIES PATCHED"
            value={String(aggregateFindings)}
            subline="Represents total validated findings across the current board."
            accent="primary"
          />
          <DashboardStatCard
            label="TOP SEVERITY"
            value={topLeaderboardSeverity}
            subline="Current board leader set by maximum validated impact."
          />
        </section>

        <DashboardPanel title="RANKED RESEARCHERS">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-outline/12 bg-background/75 text-left">
                  {["RANK", "RESEARCHER", "TOTAL FINDINGS", "TOTAL EARNINGS", "REP SCORE", "TOP SEVERITY"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-2.5 py-2.5 font-mono text-[0.5rem] uppercase tracking-label text-muted"
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
                    <td className="px-2.5 py-3 font-data text-[0.68rem] text-primary">{row.rank}</td>
                    <td className="px-2.5 py-3 font-data text-[0.68rem] text-foreground">
                      {row.researcher}
                    </td>
                    <td className="px-2.5 py-3 font-data text-[0.68rem] text-foreground">{row.findings}</td>
                    <td className="px-2.5 py-3 font-data text-[0.68rem] text-primary">
                      {formatCurrency(row.paidOut, 0)}
                    </td>
                    <td className="px-2.5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-data text-[0.68rem] text-foreground">{row.repScore}</span>
                        <div className="h-[6px] flex-1 bg-background">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(100, row.repScore * 10)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-3">
                      <StatusChip status={row.topSeverity} className="min-w-[5.5rem] justify-center px-0" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <DashboardPanel eyebrow="CURRENT STATUS" title={`YOUR RANK: ${liveRank}`}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="bf-label">REPUTATION</p>
                <p className="mt-1.5 bf-data text-[0.98rem] text-primary">{summary.reputationScore}</p>
              </div>
              <div>
                <p className="bf-label">NEXT TIER GOAL</p>
                <p className="mt-1.5 bf-data text-[0.66rem] text-foreground">+1.4 TO SOVEREIGN</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("OVERVIEW")}
                className="bf-button-secondary h-fit justify-center self-end px-2 py-1.5 text-[0.48rem]"
              >
                BOOST SCORE
              </button>
            </div>
          </DashboardPanel>

          <DashboardPanel eyebrow="PERSONAL POSITIONING" title="RESEARCH FOCUS">
            <div className="space-y-2.5 text-[0.64rem] leading-5 text-muted">
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

  function renderUtilityPlaceholder(page: UtilityPage) {
    return (
      <div className="space-y-3">
        <section className="border border-outline/12 bg-surface-high/75 p-4 backdrop-blur-sm md:p-5">
          <p className="bf-label text-primary">{page.toUpperCase()}</p>
          <h1 className="bf-display mt-2 text-[1.4rem] leading-[0.92] tracking-tightHeading sm:text-[1.68rem]">
            {page}
          </h1>
          <p className="mt-3 text-[0.72rem] leading-5 text-muted">We&apos;ll add info later.</p>
        </section>
      </div>
    );
  }

  const content = utilityPage
    ? renderUtilityPlaceholder(utilityPage)
    : activeView === "OVERVIEW"
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
        className="absolute left-1/3 top-16 h-[28rem] w-[28rem] rounded-full bg-primary/8 blur-[120px]"
      />

      <div className="relative min-h-screen">
        <aside className="border-b border-outline/12 bg-surface-low/95 backdrop-blur-sm lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[10rem] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-1.5 p-1.5">
            <Link href="/" className="-ml-0.5 inline-flex">
              <Logo compact className="gap-1.5 [&_svg]:h-5 [&_svg]:w-5 [&_span]:text-[0.74rem]" />
            </Link>

            <div className="border border-outline/12 bg-background/80 p-1.5">
              <div className="space-y-1">
                <p className="bf-display text-[0.34rem] leading-none tracking-tightHeading text-foreground">
                  {profileDisplayName}
                </p>
                <p className="bf-label text-[0.38rem] text-primary">RANK: ELITE</p>
              </div>
            </div>

            <nav className="grid gap-0.5">
              {dashboardNav.map((item) => (
                <ViewNavButton
                  key={item.view}
                  view={item.view}
                  label={item.label}
                  icon={item.icon}
                  activeView={activeView}
                  onClick={setActiveView}
                />
              ))}
            </nav>

            <div className="mt-auto space-y-2">
              <Link href="/bounties" className="bf-button-primary w-full justify-center px-1.5 py-1.5 text-[0.34rem]">
                SUBMIT BUG
              </Link>

              <WalletLinkButton
                className="w-full justify-center px-1.5 py-1.5 text-[0.34rem]"
                showHelperText={false}
                showInlineFeedback={false}
              />

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bf-button-secondary w-full justify-center px-1.5 py-1.5 text-[0.34rem]"
              >
                {isLoggingOut ? "LOGGING OUT..." : "LOG OUT"}
              </button>

              <div className="grid gap-1 border border-outline/12 bg-background/80 p-1.5">
                <Link
                  href="/docs"
                  className="font-mono text-[0.34rem] uppercase tracking-label text-muted transition-colors duration-150 hover:text-foreground"
                >
                  DOCUMENTATION
                </Link>
                <Link
                  href="/docs"
                  className="font-mono text-[0.34rem] uppercase tracking-label text-muted transition-colors duration-150 hover:text-foreground"
                >
                  SUPPORT
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:ml-[10rem]">
          <header className="border-b border-outline/12 bg-background/95 px-2.5 py-2 backdrop-blur-sm lg:fixed lg:left-[10rem] lg:right-0 lg:top-0 lg:z-20 lg:px-3">
            <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="border border-outline/12 bg-surface-high px-2.5 py-1.5">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 animate-pulse-dot bg-primary" />
                    <span className="bf-label text-[0.48rem] text-primary">
                      {sessionStatusLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {(["Terminal", "Nodes", "Security"] as const).map((item) => (
                    <Link
                      key={item}
                      href={`/dashboard/${item.toLowerCase()}`}
                      className={cn(
                        "text-[0.54rem] transition-colors duration-150 hover:text-foreground",
                        utilityPage === item ? "text-primary" : "text-muted"
                      )}
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen((currentValue) => !currentValue);
                    setIsSettingsOpen(false);
                  }}
                  className="text-muted transition-colors duration-150 hover:text-foreground"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M8 2.5A3 3 0 0 1 11 5.5V8L12.5 10.5H3.5L5 8V5.5A3 3 0 0 1 8 2.5z" />
                    <path d="M6.5 12.5A1.5 1.5 0 0 0 9.5 12.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen((currentValue) => !currentValue);
                    setIsNotificationsOpen(false);
                  }}
                  className="text-muted transition-colors duration-150 hover:text-foreground"
                  aria-label="Open settings"
                >
                  <svg viewBox="0 0 50 50" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.2 3h5.5l1 5.8c1.6.4 3 .9 4.3 1.7l4.8-3.4 3.9 3.9-3.4 4.8c.8 1.3 1.3 2.8 1.7 4.3l5.8 1v5.5l-5.8 1c-.4 1.5-.9 3-1.7 4.3l3.4 4.8-3.9 3.9-4.8-3.4c-1.3.8-2.8 1.3-4.3 1.7l-1 5.8h-5.5l-1-5.8c-1.5-.4-3-.9-4.3-1.7l-4.8 3.4-3.9-3.9 3.4-4.8c-.8-1.3-1.3-2.8-1.7-4.3l-5.8-1v-5.5l5.8-1c.4-1.5.9-3 1.7-4.3l-3.4-4.8 3.9-3.9 4.8 3.4c1.3-.8 2.8-1.3 4.3-1.7z" />
                    <circle cx="25" cy="25" r="6" />
                  </svg>
                </button>
                <WalletLinkButton
                  className="min-w-[6.75rem] justify-center px-2 py-1.5 text-[0.46rem]"
                  showHelperText={false}
                  showInlineFeedback={false}
                />

                {isNotificationsOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[19rem] border border-outline/12 bg-background p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="bf-label text-primary">NOTIFICATIONS</p>
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="font-mono text-[0.6rem] uppercase tracking-label text-muted"
                      >
                        CLOSE
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {notificationItems.map((item) => (
                        <div key={item.id} className="border border-outline/10 bg-surface-high px-3 py-3">
                          <p className="bf-label text-foreground">{item.label}</p>
                          <p className="mt-2 text-[0.72rem] leading-5 text-muted">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isSettingsOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[19rem] border border-outline/12 bg-background p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="bf-label text-primary">SETTINGS</p>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(false)}
                        className="font-mono text-[0.6rem] uppercase tracking-label text-muted"
                      >
                        CLOSE
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="border border-outline/10 bg-surface-high px-3 py-3">
                        <p className="bf-label">SESSION ROLE</p>
                        <p className="mt-2 text-[0.72rem] leading-5 text-muted">RESEARCHER</p>
                      </div>
                      <div className="border border-outline/10 bg-surface-high px-3 py-3">
                        <p className="bf-label">PAYOUT WALLET</p>
                        <p className="mt-2 text-[0.72rem] leading-5 text-muted">
                          {currentUser?.walletLinked
                            ? truncateAddress(currentUser.walletAddress)
                            : "NOT LINKED"}
                        </p>
                      </div>
                      <WalletLinkButton
                        className="w-full justify-center px-3 py-2 text-[0.58rem]"
                        showHelperText={false}
                        showInlineFeedback={false}
                      />
                      <Link
                        href="/docs"
                        className="bf-button-secondary w-full justify-center px-3 py-2 text-[0.58rem]"
                      >
                        OPEN DOCUMENTATION
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="px-2.5 py-3 md:px-3 lg:px-3 lg:pb-4 lg:pt-[3.9rem]">
            <div className="mx-auto w-full max-w-[80rem]">{content}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
