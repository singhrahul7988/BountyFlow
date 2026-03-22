import type { SubmissionDisputeNote } from "@/lib/demo-types";

export type ResearcherSubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "AI SCORING"
  | "AI SCORED"
  | "UNDER REVIEW"
  | "FIX IN PROGRESS"
  | "DISPUTE WINDOW"
  | "DISPUTE OPEN"
  | "REJECTED"
  | "PAID";

export type UploadedEvidenceFile = {
  name: string;
  path?: string;
  url?: string;
  size: number;
  mimeType: string;
  kind: "image" | "pdf" | "video" | "archive" | "code" | "other";
};

export type ResearcherSubmission = {
  id: string;
  bountySlug: string;
  bountyName: string;
  title: string;
  submittedAt: string;
  aiScore: number;
  status: ResearcherSubmissionStatus;
  payout: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  responseEta?: string;
  txHash?: string;
  description: string;
  stepsToReproduce: string[];
  impactAssessment: string;
  evidence: {
    codeFiles: number;
    screenshots: number;
    githubUrl?: string;
    references: string[];
    uploadedFiles?: UploadedEvidenceFile[];
  };
  dispute?: SubmissionDisputeNote;
};

export type PayoutHistoryEntry = {
  id: string;
  occurredAt: string;
  amount: number;
  bountyName: string;
  txHash: string;
  isCritical?: boolean;
};

export type DashboardSummary = {
  totalEarned: number;
  submissions: number;
  active: number;
  review: number;
  resolved: number;
  rejected: number;
  reputationScore: number;
  reputationPercentile: string;
  averageAiScore: number;
  averageAiScoreDelta: string;
};

export const dashboardSummary: DashboardSummary = {
  totalEarned: 14200,
  submissions: 11,
  active: 3,
  review: 2,
  resolved: 6,
  rejected: 0,
  reputationScore: 8.6,
  reputationPercentile: "TOP 12% GLOBALLY",
  averageAiScore: 7.9,
  averageAiScoreDelta: "+0.4 VS LAST MONTH"
};

export const researcherSubmissions: ResearcherSubmission[] = [
  {
    id: "sub-9920",
    bountySlug: "modular-layer-2",
    bountyName: "MODULAR LAYER 2",
    title: "Delayed bridge root replay against stale proof acceptance",
    submittedAt: "Mar 22, 2026 | 09:14 UTC",
    aiScore: 9.2,
    status: "UNDER REVIEW",
    payout: 16000,
    severity: "CRITICAL",
    responseEta: "ETA 6H",
    description:
      "A proof replay path remains valid after a delayed root update, allowing an attacker to claim liquidity against a stale settlement window.",
    stepsToReproduce: [
      "Publish a valid proof against root N while withholding settlement.",
      "Wait for root N+1 to finalize without invalidating the earlier replay path.",
      "Resubmit the original proof against the stale acceptance branch."
    ],
    impactAssessment:
      "An attacker can drain exit liquidity for a subset of pending bridge withdrawals before the invalidation window catches up.",
    evidence: {
      codeFiles: 2,
      screenshots: 3,
      githubUrl: "https://github.com/example/modular-bridge-poc",
      references: ["bridge replay condition", "proof invalidation race"]
    }
  },
  {
    id: "sub-9881",
    bountySlug: "oracle-fast-path",
    bountyName: "ORACLE FAST PATH",
    title: "Fallback feed accepted after stale threshold breach",
    submittedAt: "Mar 21, 2026 | 18:42 UTC",
    aiScore: 8.1,
    status: "AI SCORED",
    payout: 6000,
    severity: "HIGH",
    responseEta: "ETA 14H",
    description:
      "The fallback feed remains routable after the primary feed exceeds the documented staleness threshold, enabling stale-price consumption.",
    stepsToReproduce: [
      "Delay primary feed updates past the expected freshness window.",
      "Force fallback arbitration through the recovery branch.",
      "Observe stale price usage before invalidation triggers."
    ],
    impactAssessment:
      "Protocols depending on the oracle can execute with outdated values, exposing liquidations and undercollateralized settlements.",
    evidence: {
      codeFiles: 1,
      screenshots: 1,
      githubUrl: "https://github.com/example/oracle-fast-path-report",
      references: ["staleness threshold mismatch"]
    }
  },
  {
    id: "sub-9802",
    bountySlug: "tether-wdk-integration",
    bountyName: "TETHER WDK INTEGRATION",
    title: "Escrow policy bypass through stale signer cache",
    submittedAt: "Mar 20, 2026 | 13:05 UTC",
    aiScore: 7.6,
    status: "AI SCORING",
    payout: 7200,
    severity: "HIGH",
    description:
      "A signer cache persists after policy rotation, which may permit stale approval logic to authorize a release path unexpectedly.",
    stepsToReproduce: [
      "Rotate policy ownership in the wallet coordinator.",
      "Reuse a cached signer session without renewing policy context.",
      "Trigger payout preparation and inspect authorization output."
    ],
    impactAssessment:
      "The issue risks a payout authorization mismatch and weakens confidence in policy rotation guarantees.",
    evidence: {
      codeFiles: 1,
      screenshots: 0,
      references: ["session cache replay"]
    }
  },
  {
    id: "sub-9735",
    bountySlug: "solana-defi-core-v3",
    bountyName: "SOLANA DEFI CORE V3",
    title: "Liquidation reserve mismatch during authority handoff",
    submittedAt: "Mar 19, 2026 | 07:48 UTC",
    aiScore: 7.1,
    status: "SUBMITTED",
    payout: 4500,
    severity: "MEDIUM",
    description:
      "Reserve accounting can drift if liquidation state transitions overlap with an authority handoff across strategy modules.",
    stepsToReproduce: [
      "Queue liquidation execution against a live reserve.",
      "Trigger authority handoff before reserve state settles.",
      "Observe mismatched reserve totals across modules."
    ],
    impactAssessment:
      "The bug can delay reserve reconciliation and cause incorrect liquidation accounting under constrained operator timing.",
    evidence: {
      codeFiles: 1,
      screenshots: 2,
      references: ["reserve accounting race"]
    }
  },
  {
    id: "sub-9691",
    bountySlug: "evm-restaking-hub",
    bountyName: "EVM RESTAKING HUB",
    title: "Operator undelegation draft with slash-accounting notes",
    submittedAt: "Mar 18, 2026 | 21:11 UTC",
    aiScore: 0,
    status: "DRAFT",
    payout: 0,
    severity: "LOW",
    description:
      "Early draft capturing a possible undelegation timing gap in slash attribution. The report has not been submitted yet.",
    stepsToReproduce: [
      "Collect operator and delegator state before undelegation.",
      "Trigger slash event during undelegation cooldown.",
      "Compare slash attribution between operator and delegator ledgers."
    ],
    impactAssessment:
      "If validated, slash attribution could diverge between the manager module and downstream accounting.",
    evidence: {
      codeFiles: 0,
      screenshots: 0,
      references: ["draft notes only"]
    }
  },
  {
    id: "sub-9604",
    bountySlug: "modular-layer-2",
    bountyName: "MODULAR LAYER 2",
    title: "Mitigation deployed for forced withdrawal griefing path",
    submittedAt: "Mar 17, 2026 | 16:20 UTC",
    aiScore: 8.4,
    status: "FIX IN PROGRESS",
    payout: 8000,
    severity: "HIGH",
    description:
      "A forced withdrawal queue can be griefed through repeated low-cost challenge submissions. The team has acknowledged the issue and is deploying a fix.",
    stepsToReproduce: [
      "Create a withdrawal batch near the challenge threshold.",
      "Submit repeated low-cost challenges across consecutive windows.",
      "Observe forced reprocessing and delayed settlement."
    ],
    impactAssessment:
      "Users face severe withdrawal delay and liveness degradation until the mitigation is applied.",
    evidence: {
      codeFiles: 2,
      screenshots: 1,
      githubUrl: "https://github.com/example/l2-griefing-report",
      references: ["challenge spam pattern"]
    }
  },
  {
    id: "sub-9550",
    bountySlug: "tether-wdk-integration",
    bountyName: "TETHER WDK INTEGRATION",
    title: "Approved payout awaiting dispute expiry",
    submittedAt: "Mar 16, 2026 | 10:02 UTC",
    aiScore: 8.7,
    status: "DISPUTE WINDOW",
    payout: 5400,
    severity: "HIGH",
    description:
      "The report identified a replayable payout preparation path and was approved at 60% pending dispute expiry.",
    stepsToReproduce: [
      "Prepare payout payload from a stale authorization bundle.",
      "Replay the bundle after escrow nonce advancement.",
      "Inspect duplicated preparation acceptance."
    ],
    impactAssessment:
      "A replayed preparation path can create conflicting payout state and complicate release validation.",
    evidence: {
      codeFiles: 2,
      screenshots: 2,
      githubUrl: "https://github.com/example/wdk-replay-bundle",
      references: ["nonce advancement mismatch"]
    }
  },
  {
    id: "sub-9472",
    bountySlug: "solana-defi-core-v3",
    bountyName: "SOLANA DEFI CORE V3",
    title: "Vault share inflation during partial settlement rollback",
    submittedAt: "Mar 14, 2026 | 11:56 UTC",
    aiScore: 8.8,
    status: "PAID",
    payout: 3200,
    severity: "HIGH",
    txHash: "0x83aa...9c10",
    description:
      "A rollback branch could momentarily inflate vault shares before final reserve reconciliation. The payout has been released.",
    stepsToReproduce: [
      "Interrupt partial settlement after share issuance.",
      "Force rollback before reserve totals update.",
      "Measure temporary share inflation."
    ],
    impactAssessment:
      "The issue enables localized share inflation and potential unfair redemption advantage.",
    evidence: {
      codeFiles: 1,
      screenshots: 2,
      references: ["vault rollback inflation"]
    }
  },
  {
    id: "sub-9410",
    bountySlug: "oracle-fast-path",
    bountyName: "ORACLE FAST PATH",
    title: "Grace-period feed drift accepted in liquidation path",
    submittedAt: "Mar 11, 2026 | 08:30 UTC",
    aiScore: 6.4,
    status: "PAID",
    payout: 1800,
    severity: "MEDIUM",
    txHash: "0x11c0...77ad",
    description:
      "A short grace period allowed fallback feed drift to enter liquidation execution before the invalidation path completed.",
    stepsToReproduce: [
      "Delay oracle invalidation through the grace period branch.",
      "Trigger liquidation relying on the fallback feed.",
      "Observe execution under a stale but accepted value."
    ],
    impactAssessment:
      "The finding impacts liquidation fairness but requires precise timing and reduced feed availability.",
    evidence: {
      codeFiles: 1,
      screenshots: 1,
      references: ["liquidation feed drift"]
    }
  },
  {
    id: "sub-9357",
    bountySlug: "evm-restaking-hub",
    bountyName: "EVM RESTAKING HUB",
    title: "Validator manager role collision in staged upgrade",
    submittedAt: "Mar 08, 2026 | 19:44 UTC",
    aiScore: 7.3,
    status: "PAID",
    payout: 2200,
    severity: "MEDIUM",
    txHash: "0x7419...aa13",
    description:
      "A staged upgrade path left a temporary overlap between legacy and new validator manager roles.",
    stepsToReproduce: [
      "Schedule a manager upgrade in staged mode.",
      "Trigger role synchronization before legacy role revocation.",
      "Observe temporary overlapping privileges."
    ],
    impactAssessment:
      "Privilege overlap could permit unintended manager actions during the upgrade window.",
    evidence: {
      codeFiles: 2,
      screenshots: 0,
      references: ["upgrade role overlap"]
    }
  },
  {
    id: "sub-9302",
    bountySlug: "modular-layer-2",
    bountyName: "MODULAR LAYER 2",
    title: "Message retry loop causes duplicate settlement attempt",
    submittedAt: "Mar 05, 2026 | 15:18 UTC",
    aiScore: 7.8,
    status: "PAID",
    payout: 1600,
    severity: "LOW",
    txHash: "0x99fe...51bd",
    description:
      "A retry loop on failed bridge message settlement can requeue a duplicate settlement attempt before cleanup finishes.",
    stepsToReproduce: [
      "Force a settlement retry by interrupting callback completion.",
      "Resubmit the same message within the cleanup window.",
      "Observe duplicate settlement attempt scheduling."
    ],
    impactAssessment:
      "The bug does not directly release funds but can clutter settlement queues and degrade operator workflows.",
    evidence: {
      codeFiles: 1,
      screenshots: 1,
      references: ["duplicate settlement retry"]
    }
  }
];

export const payoutHistory: PayoutHistoryEntry[] = [
  {
    id: "pay-01",
    occurredAt: "Mar 14, 2026 | 14:21 UTC",
    amount: 3200,
    bountyName: "SOLANA DEFI CORE V3",
    txHash: "0x83aa...9c10",
    isCritical: true
  },
  {
    id: "pay-02",
    occurredAt: "Mar 11, 2026 | 12:03 UTC",
    amount: 1800,
    bountyName: "ORACLE FAST PATH",
    txHash: "0x11c0...77ad"
  },
  {
    id: "pay-03",
    occurredAt: "Mar 08, 2026 | 22:15 UTC",
    amount: 2200,
    bountyName: "EVM RESTAKING HUB",
    txHash: "0x7419...aa13"
  },
  {
    id: "pay-04",
    occurredAt: "Mar 05, 2026 | 17:49 UTC",
    amount: 1600,
    bountyName: "MODULAR LAYER 2",
    txHash: "0x99fe...51bd"
  },
  {
    id: "pay-05",
    occurredAt: "Feb 27, 2026 | 09:57 UTC",
    amount: 5400,
    bountyName: "TETHER WDK INTEGRATION",
    txHash: "0xfa18...d401"
  }
];

export const reputationBreakdown = {
  currentScore: 8.6,
  percentile: "TOP 12% GLOBALLY",
  metrics: [
    { label: "CRITICAL FINDINGS", value: "04" },
    { label: "HIGH FINDINGS", value: "09" },
    { label: "AVG SCORE", value: "7.9" },
    { label: "DISPUTE RATE", value: "3%" }
  ],
  unlockedTier: "TIER 2 RESEARCHER - UNLOCKED",
  nextTier: "TIER 3 RESEARCHER - 9.0+ REQUIRED"
};

export function getResearcherSubmissionById(id: string) {
  return researcherSubmissions.find((submission) => submission.id === id);
}
