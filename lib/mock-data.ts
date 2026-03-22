export type TickerItem = {
  id: string;
  label: string;
  amount?: string;
  emphasis?: "primary" | "danger" | "muted";
};

export type BountyCardData = {
  slug?: string;
  href?: string;
  title: string;
  platform: string;
  rewardPool: number;
  tiers: string[];
  submissionCount: number;
  status: string;
  severity: "featured" | "high" | "open";
  description: string;
  ctaLabel: string;
};

export type AnalyzerMetric = {
  label: string;
  value: number;
};

export const tickerItems: TickerItem[] = [
  { id: "t1", label: "PAYOUT SENT", amount: "$6,400 USDT", emphasis: "primary" },
  { id: "t2", label: "NEW SUBMISSION", amount: "SCORE 7.8", emphasis: "muted" },
  { id: "t3", label: "CRITICAL FLAG", amount: "9.2 / 10", emphasis: "danger" },
  { id: "t4", label: "YIELD CREDIT", amount: "+$182.44", emphasis: "primary" },
  { id: "t5", label: "ESCROW VERIFIED", amount: "ETH MAINNET", emphasis: "muted" },
  { id: "t6", label: "PAYOUT SENT", amount: "$12,000 USDT", emphasis: "primary" },
  { id: "t7", label: "DUPLICATE CHECK", amount: "CLEAR", emphasis: "muted" }
];

export const pipelineSteps = [
  {
    id: "01",
    title: "SUBMIT FINDING",
    description: "Upload code snippets, evidence, and exploit narrative for instant routing."
  },
  {
    id: "02",
    title: "AI SCORES",
    description: "Composite scoring ranks reproducibility, impact, novelty, and CVSS alignment."
  },
  {
    id: "03",
    title: "ADMIN REVIEWS",
    description: "Filtered queue strips out noise and surfaces only validated attack paths."
  },
  {
    id: "04",
    title: "USDT RELEASED",
    description: "Escrow settles on-chain after review and the dispute window closes."
  }
];

export const liveBounties: BountyCardData[] = [
  {
    slug: "solana-defi-core-v3",
    title: "SOLANA DEFI CORE V3",
    platform: "OPTIONAL | SECURITY",
    rewardPool: 50000,
    tiers: ["MIN", "MAX", "MULTI-SIG", "ESCROW VERIFIED"],
    submissionCount: 12,
    status: "ACTIVE",
    severity: "featured",
    description: "Cross-program re-entry issues in vault and market contracts.",
    ctaLabel: "HUNT NOW"
  },
  {
    slug: "tether-wdk-integration",
    title: "TETHER WDK INTEGRATION",
    platform: "NEW BOUNTY",
    rewardPool: 45000,
    tiers: ["ETH", "MAINNET", "API", "LIVE"],
    submissionCount: 8,
    status: "HIGH REWARD",
    severity: "high",
    description: "Agent-controlled payment release and signature orchestration checks.",
    ctaLabel: "SUBMIT REPORT"
  },
  {
    slug: "modular-layer-2",
    title: "MODULAR LAYER 2",
    platform: "OPEN SCOPE",
    rewardPool: 100000,
    tiers: ["ROLLUP", "BRIDGE", "STATE ROOT", "VERIFIED"],
    submissionCount: 24,
    status: "ESCROW VERIFIED",
    severity: "open",
    description: "Latency-driven proof sequencing and bridge race conditions.",
    ctaLabel: "VIEW DOCS"
  },
  {
    slug: "evm-restaking-hub",
    title: "EVM RESTAKING HUB",
    platform: "FAST REVIEW",
    rewardPool: 75000,
    tiers: ["EIGEN", "SLASHING", "NODE OPS", "ACTIVE"],
    submissionCount: 17,
    status: "NEW",
    severity: "high",
    description: "Delegation slashing vectors across validator manager modules.",
    ctaLabel: "HUNT NOW"
  },
  {
    slug: "oracle-fast-path",
    title: "ORACLE FAST PATH",
    platform: "OPEN AUDIT",
    rewardPool: 30000,
    tiers: ["PRICE FEED", "LATENCY", "GUARDRAILS", "OPEN"],
    submissionCount: 6,
    status: "LIVE",
    severity: "open",
    description: "Oracle reconciliation timing and stale-price invalidation edge cases.",
    ctaLabel: "VIEW DETAILS"
  }
];

export const treasuryBars = [48, 72, 54, 80, 64, 92, 76];

export const analyzerMetrics: AnalyzerMetric[] = [
  { label: "LOGIC REQUIRED", value: 0.85 },
  { label: "IMPACT SCORE", value: 0.62 },
  { label: "REPRODUCIBILITY", value: 0.49 }
];

const rawLeaderboardRows = [
  {
    researcher: "Light_inFlight",
    findings: 42,
    paidOut: 60000,
    repScore: 9.8,
    topSeverity: "CRITICAL"
  },
  {
    researcher: "0xEntropy",
    findings: 29,
    paidOut: 38150,
    repScore: 8.8,
    topSeverity: "CRITICAL"
  },
  {
    researcher: "StackBuster",
    findings: 64,
    paidOut: 61000,
    repScore: 7.6,
    topSeverity: "HIGH"
  },
  {
    researcher: "BitWarden",
    findings: 13,
    paidOut: 42050,
    repScore: 8.3,
    topSeverity: "CRITICAL"
  },
  {
    researcher: "LocalMinter",
    findings: 38,
    paidOut: 29700,
    repScore: 9.2,
    topSeverity: "HIGH"
  },
  {
    researcher: "ZeroDaySignal",
    findings: 31,
    paidOut: 28400,
    repScore: 8.9,
    topSeverity: "CRITICAL"
  },
  {
    researcher: "ProofSurge",
    findings: 27,
    paidOut: 25100,
    repScore: 8.5,
    topSeverity: "HIGH"
  },
  {
    researcher: "ChainTraceX",
    findings: 35,
    paidOut: 26850,
    repScore: 8.7,
    topSeverity: "CRITICAL"
  },
  {
    researcher: "NonceHunter",
    findings: 22,
    paidOut: 21400,
    repScore: 8.1,
    topSeverity: "HIGH"
  },
  {
    researcher: "VaultBreaker",
    findings: 41,
    paidOut: 33200,
    repScore: 9.1,
    topSeverity: "CRITICAL"
  },
  {
    researcher: "BridgeSleuth",
    findings: 19,
    paidOut: 19800,
    repScore: 7.9,
    topSeverity: "HIGH"
  },
  {
    researcher: "DeltaInvariant",
    findings: 26,
    paidOut: 22350,
    repScore: 8.4,
    topSeverity: "HIGH"
  },
  {
    researcher: "RevertWizard",
    findings: 33,
    paidOut: 27600,
    repScore: 8.8,
    topSeverity: "CRITICAL"
  },
  {
    researcher: "StateRooter",
    findings: 24,
    paidOut: 20500,
    repScore: 8.2,
    topSeverity: "HIGH"
  },
  {
    researcher: "EscrowGhost",
    findings: 29,
    paidOut: 24150,
    repScore: 8.6,
    topSeverity: "CRITICAL"
  }
];

export const leaderboardRows = [...rawLeaderboardRows]
  .sort((left, right) => {
    if (right.findings !== left.findings) {
      return right.findings - left.findings;
    }

    return right.paidOut - left.paidOut;
  })
  .map((row, index) => ({
    ...row,
    rank: `#${String(index + 1).padStart(2, "0")}`
  }));

export const footerGroups = [
  {
    title: "PROTOCOL",
    links: [
      { label: "Bounties", href: "/bounties" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Dashboard", href: "/auth" }
    ]
  },
  {
    title: "RESOURCES",
    links: [
      { label: "Security.md", href: "/docs" },
      { label: "Tether Audits", href: "/docs" },
      { label: "GitHub", href: "/docs" }
    ]
  }
];
