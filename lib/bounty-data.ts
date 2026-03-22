export type RewardTiers = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
};

export type BountyActivity = {
  id: string;
  label: string;
  timestamp: string;
  outcome: string;
};

export type AcceptedSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type BountyDetail = {
  id: string;
  slug: string;
  title: string;
  platform: string;
  platformType: "DEFI" | "INFRA" | "L2" | "WALLET" | "ORACLE";
  platformUrl: string;
  shortDescription: string;
  description: string;
  severity: "featured" | "high" | "open";
  rewardPool: number;
  rewardTiers: RewardTiers;
  submissionCount: number;
  resolvedCount: number;
  activeCount: number;
  escrowBalance: number;
  escrowAddress: string;
  status: "ACTIVE";
  createdAt: string;
  tags: string[];
  acceptedSeverities: AcceptedSeverity[];
  acceptedEvidenceTypes: string[];
  scopeIn: string[];
  scopeOut: string[];
  severityDefinitions: { label: string; definition: string }[];
  rules: string[];
  recentActivity: BountyActivity[];
};

export const bounties: BountyDetail[] = [
  {
    id: "bounty-solana-core",
    slug: "solana-defi-core-v3",
    title: "SOLANA DEFI CORE V3",
    platform: "OPTIONAL | SECURITY",
    platformType: "DEFI",
    platformUrl: "https://corev3.optional.finance",
    shortDescription: "Cross-program re-entry issues in vault and market contracts.",
    description:
      "Core V3 secures vault accounting, liquidation paths, and reserve movement across Solana strategy modules. Researchers are invited to test escrow-sensitive logic, vault authority boundaries, and state invalidation paths that could lead to unauthorized withdrawals or broken accounting.",
    severity: "featured",
    rewardPool: 50000,
    rewardTiers: { critical: 20000, high: 10000, medium: 4500, low: 1500, informational: 500 },
    submissionCount: 12,
    resolvedCount: 8,
    activeCount: 4,
    escrowBalance: 50000,
    escrowAddress: "0x8A0F...C3D2",
    status: "ACTIVE",
    createdAt: "2026-03-18T08:30:00Z",
    tags: ["MIN", "MAX", "MULTI-SIG", "ESCROW VERIFIED"],
    acceptedSeverities: ["CRITICAL", "HIGH", "MEDIUM"],
    acceptedEvidenceTypes: ["Screenshots", "Code files", "PDFs", "ZIP archives", "PoC videos"],
    scopeIn: [
      "Vault deposit and withdrawal instructions",
      "Authority transfer and reserve accounting flows",
      "Liquidation execution paths",
      "Cross-program invocation guardrails"
    ],
    scopeOut: [
      "Front-end copy issues",
      "Rate limiting on public docs endpoints",
      "Third-party wallet browser extensions"
    ],
    severityDefinitions: [
      { label: "CRITICAL", definition: "Unauthorized reserve loss or protocol-wide insolvency." },
      { label: "HIGH", definition: "Loss of funds in a single market or broken access control." },
      { label: "MEDIUM", definition: "User funds at risk under constrained conditions." },
      { label: "LOW", definition: "Minor logic flaws without immediate financial impact." }
    ],
    rules: [
      "No public disclosure before triage is complete.",
      "Include reproducible steps and expected vault state deltas.",
      "Use a dedicated test wallet for all PoCs."
    ],
    recentActivity: [
      { id: "sol-1", label: "ANON RESEARCHER SUBMITTED A HIGH-SEVERITY FINDING", timestamp: "2 HOURS AGO", outcome: "UNDER REVIEW" },
      { id: "sol-2", label: "PREVIOUS ESCROW DISPUTE RESOLVED", timestamp: "18 HOURS AGO", outcome: "PAID" },
      { id: "sol-3", label: "NEW BOUNTY TOP-UP CONFIRMED", timestamp: "1 DAY AGO", outcome: "ESCROW VERIFIED" }
    ]
  },
  {
    id: "bounty-wdk",
    slug: "tether-wdk-integration",
    title: "TETHER WDK INTEGRATION",
    platform: "NEW BOUNTY",
    platformType: "WALLET",
    platformUrl: "https://wdk-integration.bountyflow.local",
    shortDescription: "Agent-controlled payment release and signature orchestration checks.",
    description:
      "This bounty covers wallet orchestration logic around delegated transaction preparation, policy enforcement, and payout release sequencing. The target focus is any path where escrow instructions or approval controls can be bypassed, replayed, or misrouted.",
    severity: "high",
    rewardPool: 45000,
    rewardTiers: { critical: 18000, high: 9000, medium: 4000, low: 1500, informational: 500 },
    submissionCount: 8,
    resolvedCount: 5,
    activeCount: 3,
    escrowBalance: 45000,
    escrowAddress: "0x91D1...AB29",
    status: "ACTIVE",
    createdAt: "2026-03-20T12:10:00Z",
    tags: ["ETH", "MAINNET", "API", "LIVE"],
    acceptedSeverities: ["HIGH", "MEDIUM", "LOW"],
    acceptedEvidenceTypes: ["Code files", "PDF writeups", "GitHub links", "Screenshots"],
    scopeIn: [
      "Signature orchestration and sequencing",
      "Escrow release policy checks",
      "Wallet session boundary enforcement",
      "Replay and duplicate payout conditions"
    ],
    scopeOut: ["UI-only animation glitches", "Staging-only test fixtures", "Non-security feature requests"],
    severityDefinitions: [
      { label: "CRITICAL", definition: "Unauthorized payout release or wallet compromise." },
      { label: "HIGH", definition: "Policy bypass or incorrect transaction authorization." },
      { label: "MEDIUM", definition: "Misconfigured payout routing without direct loss." },
      { label: "LOW", definition: "Incorrect state transitions or weak validation." }
    ],
    rules: [
      "Include transaction traces where applicable.",
      "Provide the exact policy state before and after exploit.",
      "Avoid stress-testing public infrastructure during review."
    ],
    recentActivity: [
      { id: "wdk-1", label: "ADMIN APPROVED A PARTIAL PAYOUT", timestamp: "6 HOURS AGO", outcome: "DISPUTE WINDOW" },
      { id: "wdk-2", label: "NEW SUBMISSION QUALIFIED FOR REVIEW", timestamp: "10 HOURS AGO", outcome: "UNDER REVIEW" },
      { id: "wdk-3", label: "TREASURY YIELD CREDIT POSTED", timestamp: "1 DAY AGO", outcome: "YIELD" }
    ]
  },
  {
    id: "bounty-modular-l2",
    slug: "modular-layer-2",
    title: "MODULAR LAYER 2",
    platform: "OPEN SCOPE",
    platformType: "L2",
    platformUrl: "https://modular-l2.bridge",
    shortDescription: "Latency-driven proof sequencing and bridge race conditions.",
    description:
      "The Modular Layer 2 bounty focuses on proof sequencing, bridge exits, and challenge-response timing. Submissions should concentrate on state root validation, delayed message execution, and conditions where users can exit against stale or manipulated proofs.",
    severity: "open",
    rewardPool: 100000,
    rewardTiers: { critical: 40000, high: 18000, medium: 8000, low: 2500, informational: 750 },
    submissionCount: 24,
    resolvedCount: 14,
    activeCount: 10,
    escrowBalance: 100000,
    escrowAddress: "0x4BD9...F712",
    status: "ACTIVE",
    createdAt: "2026-03-15T06:45:00Z",
    tags: ["ROLLUP", "BRIDGE", "STATE ROOT", "VERIFIED"],
    acceptedSeverities: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
    acceptedEvidenceTypes: ["ZIP archives", "Code files", "Screenshots", "GitHub links", "PoC videos"],
    scopeIn: [
      "Bridge message validation",
      "State root publication and proof verification",
      "Withdraw queues and exit sequencing",
      "Challenge period bypass attempts"
    ],
    scopeOut: ["Centralized exchange integrations", "Third-party analytics dashboards", "Informational gas optimizations"],
    severityDefinitions: [
      { label: "CRITICAL", definition: "Cross-chain fund loss or invalid state finalization." },
      { label: "HIGH", definition: "Bridge theft, replay, or settlement bypass." },
      { label: "MEDIUM", definition: "Incorrect withdrawal accounting or liveness impact." },
      { label: "LOW", definition: "Minor validation inconsistencies." }
    ],
    rules: [
      "Demonstrate exploit timing assumptions clearly.",
      "Include proof payloads if state root validation is involved.",
      "No public chain spam while reproducing."
    ],
    recentActivity: [
      { id: "l2-1", label: "CRITICAL SUBMISSION LOCKED FOR REVIEW", timestamp: "38 MIN AGO", outcome: "CRITICAL" },
      { id: "l2-2", label: "ANON RESEARCHER CLAIMED A MEDIUM FINDING", timestamp: "5 HOURS AGO", outcome: "PAID" },
      { id: "l2-3", label: "YIELD ROUTE REBALANCED", timestamp: "1 DAY AGO", outcome: "AAVE V3" }
    ]
  },
  {
    id: "bounty-restaking",
    slug: "evm-restaking-hub",
    title: "EVM RESTAKING HUB",
    platform: "FAST REVIEW",
    platformType: "INFRA",
    platformUrl: "https://evm-restaking-hub.network",
    shortDescription: "Delegation slashing vectors across validator manager modules.",
    description:
      "This bounty covers delegation routing, operator registration, slashing accounting, and validator manager upgrade boundaries across an EVM restaking stack. Researchers should focus on paths where stake ownership, slashing attribution, or withdrawal rights can be mis-accounted or incorrectly escalated.",
    severity: "high",
    rewardPool: 75000,
    rewardTiers: { critical: 30000, high: 14000, medium: 6000, low: 2000, informational: 500 },
    submissionCount: 17,
    resolvedCount: 11,
    activeCount: 6,
    escrowBalance: 75000,
    escrowAddress: "0x77E1...4B19",
    status: "ACTIVE",
    createdAt: "2026-03-19T14:25:00Z",
    tags: ["EIGEN", "SLASHING", "NODE OPS", "ACTIVE"],
    acceptedSeverities: ["CRITICAL", "HIGH", "MEDIUM"],
    acceptedEvidenceTypes: ["Code files", "ZIP archives", "PoC videos", "GitHub links"],
    scopeIn: [
      "Delegation registration and undelegation flows",
      "Slashing accounting and attribution logic",
      "Validator manager upgrade and ownership controls",
      "Reward distribution and withdrawal settlement paths"
    ],
    scopeOut: [
      "Third-party operator dashboards",
      "Governance forum discussion tooling",
      "Gas-only efficiency suggestions without security impact"
    ],
    severityDefinitions: [
      { label: "CRITICAL", definition: "Slashable stake loss, ownership takeover, or irreversible withdrawal theft." },
      { label: "HIGH", definition: "Incorrect slashing, unauthorized operator control, or reward theft." },
      { label: "MEDIUM", definition: "Delegation accounting drift or withdrawal blocking under specific conditions." },
      { label: "LOW", definition: "Validation gaps without direct immediate fund loss." }
    ],
    rules: [
      "Demonstrate exact validator or delegation state transitions.",
      "Include operator and delegator assumptions in every report.",
      "Do not interact with real production validators during testing."
    ],
    recentActivity: [
      { id: "restake-1", label: "NEW RESTAKING SUBMISSION ENTERED REVIEW", timestamp: "52 MIN AGO", outcome: "UNDER REVIEW" },
      { id: "restake-2", label: "ESCROW TOP-UP CONFIRMED ON-CHAIN", timestamp: "7 HOURS AGO", outcome: "VERIFIED" },
      { id: "restake-3", label: "HIGH-SEVERITY DUPLICATE REJECTED", timestamp: "1 DAY AGO", outcome: "REJECTED" }
    ]
  },
  {
    id: "bounty-oracle",
    slug: "oracle-fast-path",
    title: "ORACLE FAST PATH",
    platform: "OPEN AUDIT",
    platformType: "ORACLE",
    platformUrl: "https://oracle-fastpath.network",
    shortDescription: "Oracle reconciliation timing and stale-price invalidation edge cases.",
    description:
      "This program targets stale-price windows, fallback feed drift, and delayed invalidation logic. Researchers should assess whether stale or manipulated price states can be consumed before guardrails trigger, especially during periods of degraded feed availability.",
    severity: "open",
    rewardPool: 30000,
    rewardTiers: { critical: 12000, high: 6000, medium: 2500, low: 1000, informational: 300 },
    submissionCount: 6,
    resolvedCount: 4,
    activeCount: 2,
    escrowBalance: 30000,
    escrowAddress: "0xD15C...9E40",
    status: "ACTIVE",
    createdAt: "2026-03-21T09:00:00Z",
    tags: ["PRICE FEED", "LATENCY", "GUARDRAILS", "OPEN"],
    acceptedSeverities: ["HIGH", "MEDIUM", "LOW"],
    acceptedEvidenceTypes: ["PDF writeups", "Screenshots", "Code files"],
    scopeIn: [
      "Fallback feed selection",
      "Price invalidation timing",
      "Cross-feed arbitration logic",
      "Staleness threshold enforcement"
    ],
    scopeOut: ["Marketing site issues", "Non-price governance UI bugs", "Historical analytics mismatches"],
    severityDefinitions: [
      { label: "CRITICAL", definition: "Price corruption causing direct fund loss." },
      { label: "HIGH", definition: "Stale or manipulated feeds consumed in production." },
      { label: "MEDIUM", definition: "Incorrect invalidation or delayed fallback usage." },
      { label: "LOW", definition: "Minor telemetry or reporting mismatches." }
    ],
    rules: [
      "Reproduce against documented feed states.",
      "State all timing assumptions and delays.",
      "Do not target live production endpoints with flood traffic."
    ],
    recentActivity: [
      { id: "ora-1", label: "NEW HIGH-SCORE FINDING ROUTED TO TEAM", timestamp: "3 HOURS AGO", outcome: "UNDER REVIEW" },
      { id: "ora-2", label: "ESCROW BALANCE VERIFIED ON-CHAIN", timestamp: "9 HOURS AGO", outcome: "VERIFIED" },
      { id: "ora-3", label: "LOW-SEVERITY DUPLICATE AUTO-REJECTED", timestamp: "1 DAY AGO", outcome: "REJECTED" }
    ]
  }
];

export function getBountyBySlug(slug: string) {
  return bounties.find((bounty) => bounty.slug === slug);
}
