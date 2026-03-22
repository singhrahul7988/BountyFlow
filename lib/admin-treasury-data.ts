export type TreasuryChartPoint = {
  day: string;
  amount: number;
};

export type TreasuryAllocationRow = {
  category: string;
  amount: number;
  percentOfPool: number;
  status: string;
};

export type TreasuryTransactionType = "DEPOSIT" | "PAYOUT" | "YIELD";

export type TreasuryTransaction = {
  id: string;
  date: string;
  type: TreasuryTransactionType;
  amount: number;
  description: string;
  txHash: string;
};

export const treasurySummary = {
  totalDeposited: 50000,
  availableBalance: 30000,
  yieldEarned: 1842.44
};

export const treasuryYieldChart: TreasuryChartPoint[] = [
  { day: "MAR 9", amount: 72.3 },
  { day: "MAR 10", amount: 80.5 },
  { day: "MAR 11", amount: 76.2 },
  { day: "MAR 12", amount: 91.4 },
  { day: "MAR 13", amount: 88.7 },
  { day: "MAR 14", amount: 94.8 },
  { day: "MAR 15", amount: 103.1 },
  { day: "MAR 16", amount: 98.6 },
  { day: "MAR 17", amount: 112.4 },
  { day: "MAR 18", amount: 118.8 },
  { day: "MAR 19", amount: 121.6 },
  { day: "MAR 20", amount: 127.9 },
  { day: "MAR 21", amount: 132.1 },
  { day: "MAR 22", amount: 140.2 }
];

export const treasuryAllocation: TreasuryAllocationRow[] = [
  { category: "PAID OUT", amount: 12000, percentOfPool: 24, status: "PAID" },
  { category: "RESERVED", amount: 8000, percentOfPool: 16, status: "DISPUTE WINDOW" },
  { category: "AVAILABLE", amount: 30000, percentOfPool: 60, status: "EARNING YIELD" }
];

export const treasuryTransactions: TreasuryTransaction[] = [
  {
    id: "tx-01",
    date: "Mar 22, 2026 | 11:04 UTC",
    type: "YIELD",
    amount: 140.2,
    description: "Aave V3 daily credit posted to idle bridge bounty treasury.",
    txHash: "0x18ff...9c02"
  },
  {
    id: "tx-02",
    date: "Mar 21, 2026 | 16:19 UTC",
    type: "PAYOUT",
    amount: -5400,
    description: "Partial payout approved for WDK replay finding, now in dispute window.",
    txHash: "0xfa18...d401"
  },
  {
    id: "tx-03",
    date: "Mar 20, 2026 | 09:48 UTC",
    type: "DEPOSIT",
    amount: 10000,
    description: "Owner top-up confirmed to the dedicated WDK escrow wallet.",
    txHash: "0x0ad2...4bc7"
  },
  {
    id: "tx-04",
    date: "Mar 18, 2026 | 08:11 UTC",
    type: "YIELD",
    amount: 126.7,
    description: "Yield route rebalance credit applied after utilization update.",
    txHash: "0x77ce...2d9e"
  },
  {
    id: "tx-05",
    date: "Mar 14, 2026 | 14:21 UTC",
    type: "PAYOUT",
    amount: -3200,
    description: "Paid Solana reserve rollback finding after dispute window closed.",
    txHash: "0x83aa...9c10"
  },
  {
    id: "tx-06",
    date: "Mar 09, 2026 | 10:30 UTC",
    type: "DEPOSIT",
    amount: 40000,
    description: "Initial bounty funding deposited and routed to the treasury wallet.",
    txHash: "0x91ab...e540"
  }
];
