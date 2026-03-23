"use client";

import { useEffect, useMemo, useState } from "react";

import {
  adminHealthBreakdown,
  adminOverviewStats,
  adminRecentActivity,
  resolveOwnerProgram
} from "@/lib/admin-data";
import { adminSubmissions as seededAdminSubmissions } from "@/lib/admin-submissions-data";
import { fetchRemoteTreasury } from "@/lib/demo-api";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { formatCurrency } from "@/lib/utils";
import { AdminOverview } from "./admin-overview";

type TreasuryPayload = {
  summary: {
    totalDeposited: number;
    availableBalance: number;
    yieldEarned: number;
  };
  allocation: {
    category: string;
    amount: number;
    percentOfPool: number;
  }[];
};

function resolveTone(value: number, primary = false) {
  if (primary) {
    return "text-primary";
  }

  if (value > 0) {
    return "text-amber";
  }

  return "text-foreground";
}

function notificationTypeToActivityTone(type: string) {
  if (type === "CRITICAL") {
    return "CRITICAL";
  }

  if (type === "PAYOUT" || type === "DISPUTE") {
    return "PAYOUT";
  }

  return "REVIEW";
}

export function AdminOverviewShell() {
  const createdBounties = useDemoDataStore((state) => state.createdBounties);
  const demoAdminSubmissions = useDemoDataStore((state) => state.demoAdminSubmissions);
  const submissionDecisions = useDemoDataStore((state) => state.submissionDecisions);
  const notifications = useDemoDataStore((state) => state.notifications);
  const [treasury, setTreasury] = useState<TreasuryPayload | null>(null);
  const ownerProgram = useMemo(() => resolveOwnerProgram(createdBounties), [createdBounties]);

  useEffect(() => {
    let cancelled = false;

    fetchRemoteTreasury()
      .then((result) => {
        if (!cancelled) {
          setTreasury({
            summary: result.summary,
            allocation: result.allocation
          });
        }
      })
      .catch(() => {
        // The overview keeps the seeded fallback if remote treasury tables are not ready.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const submissions = useMemo(() => {
    const seen = new Set<string>();

    return [...demoAdminSubmissions, ...seededAdminSubmissions]
      .filter(
        (item) =>
          item.bountySlug === ownerProgram.slug ||
          item.bountyName.toUpperCase() === ownerProgram.name.toUpperCase()
      )
      .filter((item) => {
        if (seen.has(item.id)) {
          return false;
        }

        seen.add(item.id);
        return true;
      })
      .map((item) => {
        const decision = submissionDecisions[item.id];

        return decision
          ? {
              ...item,
              status: decision.status,
              recommendedPct: decision.payoutPct,
              disputeNote: decision.disputeNote ?? item.disputeNote
            }
          : item;
      });
  }, [demoAdminSubmissions, ownerProgram, submissionDecisions]);

  const stats = useMemo(() => {
    if (!submissions.length && !treasury) {
      return adminOverviewStats;
    }

    const pendingReview = submissions.filter((submission) =>
      ["AI SCORED", "UNDER REVIEW", "DISPUTE OPEN"].includes(submission.status)
    ).length;
    const criticalFlags = submissions.filter((submission) => submission.aiScore >= 9).length;
    const paidOut = submissions.reduce((sum, submission) => {
      if (submission.status !== "PAID") {
        return sum;
      }

      return sum + Math.round((submission.tierReward * submission.recommendedPct) / 100);
    }, 0);
    const currentBalance = treasury
      ? treasury.summary.availableBalance +
        (treasury.allocation.find((item) => item.category === "RESERVED")?.amount ?? 0)
      : adminHealthBreakdown.currentBalance;
    const totalBalance = treasury
      ? treasury.summary.totalDeposited + treasury.summary.yieldEarned
      : adminHealthBreakdown.totalBalance;
    const remainingPct = totalBalance > 0 ? Math.round((currentBalance / totalBalance) * 100) : 0;

    return [
      {
        label: "TOTAL SUBMISSIONS",
        value: `${submissions.length}`,
        detail: `${criticalFlags} CRITICAL SCORE FLAGS`,
        tone: "text-foreground"
      },
      {
        label: "PENDING REVIEW",
        value: `${pendingReview}`,
        detail: `${notifications.filter((item) => item.unread).length} UNREAD OWNER ALERTS`,
        tone: resolveTone(pendingReview)
      },
      {
        label: "PAID OUT",
        value: formatCurrency(paidOut, 0),
        detail: "USDT SETTLED THROUGH TREASURY FLOW",
        tone: "text-primary"
      },
      {
        label: "TREASURY BALANCE",
        value: formatCurrency(currentBalance, 0),
        detail: `${remainingPct}% OF THE POOL REMAINING`,
        tone: resolveTone(currentBalance, true)
      }
    ];
  }, [notifications, submissions, treasury]);

  const healthBreakdown = useMemo(() => {
    if (!treasury) {
      return adminHealthBreakdown;
    }

    const totalBalance = Math.max(1, treasury.summary.totalDeposited + treasury.summary.yieldEarned);
    const paidOutAmount = treasury.allocation.find((item) => item.category === "PAID OUT")?.amount ?? 0;
    const reservedAmount = treasury.allocation.find((item) => item.category === "RESERVED")?.amount ?? 0;
    const availableAmount = treasury.allocation.find((item) => item.category === "AVAILABLE")?.amount ?? 0;
    const currentBalance = reservedAmount + availableAmount;

    return {
      remainingPct: Math.round((currentBalance / totalBalance) * 100),
      currentBalance,
      totalBalance,
      paidOutPct: Math.round((paidOutAmount / totalBalance) * 100),
      reservedPct: Math.round((reservedAmount / totalBalance) * 100),
      availablePct: Math.round((availableAmount / totalBalance) * 100),
      paidOutAmount,
      reservedAmount,
      availableAmount,
      apy: adminHealthBreakdown.apy
    };
  }, [treasury]);

  const recentActivity = useMemo(() => {
    if (!notifications.length) {
      return adminRecentActivity;
    }

    return notifications.slice(0, 5).map((item) => ({
      id: item.id,
      type: notificationTypeToActivityTone(item.type),
      label: `${item.title}. ${item.description}`,
      timestamp: item.timestamp
    }));
  }, [notifications]);

  return (
    <AdminOverview
      stats={stats}
      healthBreakdown={healthBreakdown}
      recentActivity={recentActivity}
    />
  );
}
