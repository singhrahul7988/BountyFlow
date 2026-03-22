export const adminBountyContext = {
  name: "ETHEREUM L2 BRIDGE AUDIT",
  status: "ACTIVE" as const,
  walletAddress: "0x71C8D4eA178F3901"
};

export const adminOverviewStats = [
  {
    label: "TOTAL SUBMISSIONS",
    value: "24",
    detail: "6 NEW IN THE LAST 24H",
    tone: "text-foreground"
  },
  {
    label: "PENDING REVIEW",
    value: "6",
    detail: "2 CRITICAL SCORE FLAGS",
    tone: "text-amber"
  },
  {
    label: "PAID OUT",
    value: "$12,000",
    detail: "USDT SETTLED ON-CHAIN",
    tone: "text-primary"
  },
  {
    label: "TREASURY BALANCE",
    value: "$38,000",
    detail: "76% OF THE POOL REMAINING",
    tone: "text-primary"
  }
];

export const adminHealthBreakdown = {
  remainingPct: 76,
  currentBalance: 38000,
  totalBalance: 50000,
  paidOutPct: 24,
  reservedPct: 16,
  availablePct: 60,
  paidOutAmount: 12000,
  reservedAmount: 8000,
  availableAmount: 30000,
  apy: "4.2%"
};

export const adminRecentActivity = [
  {
    id: "activity-1",
    type: "CRITICAL",
    label: "Critical bridge replay report scored 9.2 and locked for duplicate prevention.",
    timestamp: "2 MIN AGO"
  },
  {
    id: "activity-2",
    type: "PAYOUT",
    label: "USDT payout of $5,400 entered dispute window after owner approval.",
    timestamp: "18 MIN AGO"
  },
  {
    id: "activity-3",
    type: "YIELD",
    label: "Aave V3 credit posted to idle treasury balance for the active bounty wallet.",
    timestamp: "43 MIN AGO"
  },
  {
    id: "activity-4",
    type: "REVIEW",
    label: "Two AI-scored submissions crossed the notify threshold and were routed to the queue.",
    timestamp: "1 HOUR AGO"
  },
  {
    id: "activity-5",
    type: "ESCROW",
    label: "Treasury balance verified against the WDK-managed escrow address.",
    timestamp: "3 HOURS AGO"
  }
];

export const adminNavBadges = {
  submissions: 6,
  notifications: 3
};
