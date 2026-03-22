import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { AdminNotification, AdminNotificationTone } from "@/lib/admin-notifications-data";
import {
  type TreasuryAllocationRow,
  type TreasuryChartPoint,
  type TreasuryTransaction,
  type TreasuryTransactionType
} from "@/lib/admin-treasury-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import type { PersistedBountyPayload, PersistedSubmissionPayload, SubmissionDecision } from "@/lib/demo-types";

type JsonSource<T> = T | string | null;

export type DemoBountyRow = {
  slug: string;
  payload: JsonSource<PersistedBountyPayload>;
};

export type DemoSubmissionRow = {
  admin_id: string;
  researcher_submission_id: string;
  payload: JsonSource<PersistedSubmissionPayload>;
};

export type DemoNotificationRow = {
  id: string;
  type: AdminNotificationTone;
  title: string;
  description: string;
  unread: boolean;
  action_label: string | null;
  action_href: string | null;
  created_at: string;
};

export type DemoTreasuryTransactionRow = {
  id: string;
  type: TreasuryTransactionType;
  amount: number;
  description: string;
  tx_hash: string;
  created_at: string;
};

function parseJsonSource<T>(value: JsonSource<T>) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  return value;
}

export function buildDecisionFromAdminSubmission(submission: AdminSubmission): SubmissionDecision {
  return {
    status: submission.status,
    payoutPct: submission.recommendedPct
  };
}

export function formatUtcTimestamp(isoValue: string) {
  return new Date(isoValue)
    .toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC"
    })
    .replace(",", " |") + " UTC";
}

export function formatNotificationTimestamp(isoValue: string) {
  const date = new Date(isoValue);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60_000) {
    return "JUST NOW";
  }

  if (diffMs < 86_400_000) {
    return date
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC"
      })
      .replace(":", ":") + " UTC";
  }

  return formatUtcTimestamp(isoValue);
}

export function getNotificationGroup(isoValue: string): AdminNotification["group"] {
  const value = new Date(isoValue);
  const now = new Date();
  const currentDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const valueDay = Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  const diffDays = Math.floor((currentDay - valueDay) / 86_400_000);

  if (diffDays <= 0) {
    return "TODAY";
  }

  if (diffDays === 1) {
    return "YESTERDAY";
  }

  return "EARLIER";
}

export function buildPersistedSubmissionPayload(
  adminSubmission: AdminSubmission,
  researcherSubmission: ResearcherSubmission,
  decision: SubmissionDecision = buildDecisionFromAdminSubmission(adminSubmission)
): PersistedSubmissionPayload {
  return {
    adminSubmission,
    researcherSubmission,
    decision
  };
}

export function normalizeStoredBounty(row: DemoBountyRow): BountyDetail | null {
  const payload = parseJsonSource<PersistedBountyPayload>(row.payload);

  if (!payload || typeof payload !== "object" || !payload.slug) {
    return null;
  }

  return payload;
}

export function normalizeStoredSubmission(row: DemoSubmissionRow): PersistedSubmissionPayload | null {
  const payload = parseJsonSource<PersistedSubmissionPayload>(row.payload);

  if (
    !payload ||
    typeof payload !== "object" ||
    !payload.adminSubmission?.id ||
    !payload.researcherSubmission?.id
  ) {
    return null;
  }

  return payload;
}

export function normalizeStoredNotification(row: DemoNotificationRow): AdminNotification {
  return {
    id: row.id,
    group: getNotificationGroup(row.created_at),
    type: row.type,
    title: row.title,
    description: row.description,
    timestamp: formatNotificationTimestamp(row.created_at),
    unread: row.unread,
    actionLabel: row.action_label ?? undefined,
    actionHref: row.action_href ?? undefined
  };
}

export function normalizeStoredTreasuryTransaction(
  row: DemoTreasuryTransactionRow
): TreasuryTransaction {
  return {
    id: row.id,
    date: formatUtcTimestamp(row.created_at),
    type: row.type,
    amount: row.amount,
    description: row.description,
    txHash: row.tx_hash
  };
}

export function buildTreasurySnapshot(transactions: TreasuryTransaction[], reserved: number) {
  const totalDeposited = transactions
    .filter((item) => item.type === "DEPOSIT")
    .reduce((sum, item) => sum + item.amount, 0);
  const yieldEarned = transactions
    .filter((item) => item.type === "YIELD")
    .reduce((sum, item) => sum + item.amount, 0);
  const paidOut = Math.abs(
    transactions
      .filter((item) => item.type === "PAYOUT")
      .reduce((sum, item) => sum + Math.min(item.amount, 0), 0)
  );
  const availableBalance = Math.max(0, totalDeposited + yieldEarned - paidOut - reserved);
  const poolBase = Math.max(1, totalDeposited + yieldEarned);

  const allocation: TreasuryAllocationRow[] = [
    {
      category: "PAID OUT",
      amount: paidOut,
      percentOfPool: Math.round((paidOut / poolBase) * 100),
      status: "PAID"
    },
    {
      category: "RESERVED",
      amount: reserved,
      percentOfPool: Math.round((reserved / poolBase) * 100),
      status: reserved > 0 ? "DISPUTE WINDOW" : "EARNING YIELD"
    },
    {
      category: "AVAILABLE",
      amount: availableBalance,
      percentOfPool: Math.round((availableBalance / poolBase) * 100),
      status: "EARNING YIELD"
    }
  ];

  return {
    summary: {
      totalDeposited,
      availableBalance,
      yieldEarned
    },
    allocation
  };
}

export function buildTreasuryYieldChart(transactions: DemoTreasuryTransactionRow[]): TreasuryChartPoint[] {
  const now = new Date();
  const days = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(now);
    day.setUTCDate(now.getUTCDate() - (13 - index));
    return day;
  });

  return days.map((day) => {
    const key = day.toISOString().slice(0, 10);
    const amount = transactions
      .filter((item) => item.type === "YIELD")
      .reduce((sum, item) => {
        const itemDate = new Date(item.created_at);
        const itemKey = itemDate.toISOString().slice(0, 10);
        return itemKey === key ? sum + item.amount : sum;
      }, 0);

    return {
      day: day
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC"
        })
        .replace(" ", " ")
        .toUpperCase(),
      amount: Number(amount.toFixed(2))
    };
  });
}
