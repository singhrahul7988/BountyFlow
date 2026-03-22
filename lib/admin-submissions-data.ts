import type { UploadedEvidenceFile } from "@/lib/dashboard-data";
import type { SubmissionDisputeNote } from "@/lib/demo-types";

export type AdminSubmissionSeverity = "CRITICAL" | "HIGH" | "MEDIUM";

export type AdminSubmissionStatus =
  | "AI SCORED"
  | "UNDER REVIEW"
  | "DISPUTE WINDOW"
  | "DISPUTE OPEN"
  | "FIX IN PROGRESS"
  | "REJECTED"
  | "PAID";

export type AdminSubmission = {
  id: string;
  severity: AdminSubmissionSeverity;
  title: string;
  reporterAddress: string;
  reporterReputation: number;
  submittedAt: string;
  aiScore: number;
  status: AdminSubmissionStatus;
  recommendedPct: number;
  tierReward: number;
  summaryRisk: string;
  subScores: { label: string; value: number }[];
  evidencePills: string[];
  description: string;
  stepsToReproduce: string[];
  impactAssessment: string;
  codeSnippet: string;
  screenshots: string[];
  uploadedFiles?: UploadedEvidenceFile[];
  github: {
    url: string;
    repo: string;
    branch: string;
    updatedAt: string;
  };
  internalNote?: string;
  disputeNote?: SubmissionDisputeNote;
};

export const adminSubmissions: AdminSubmission[] = [
  {
    id: "BF-9920",
    severity: "CRITICAL",
    title: "Bridge proof replay accepted after stale root invalidation delay",
    reporterAddress: "0x7f3a4f9bc9d2",
    reporterReputation: 8.6,
    submittedAt: "Mar 22, 2026 | 09:14 UTC",
    aiScore: 9.2,
    status: "UNDER REVIEW",
    recommendedPct: 80,
    tierReward: 20000,
    summaryRisk: "Potential unauthorized bridge release against stale settlement state.",
    subScores: [
      { label: "REPRO", value: 0.94 },
      { label: "IMPACT", value: 0.96 },
      { label: "NOVELTY", value: 0.82 },
      { label: "COMP", value: 0.88 },
      { label: "CVSS", value: 0.91 }
    ],
    evidencePills: ["POC CODE", "3 SCREENSHOTS", "GITHUB LINK"],
    description:
      "A replayable proof remains valid for a short period after root invalidation. During that window, a malicious relayer can resubmit an already-accepted proof and claim released liquidity against the stale branch.",
    stepsToReproduce: [
      "Submit a valid proof while root N is active and capture the payload.",
      "Advance the system to root N+1 without immediately invalidating pending stale proofs.",
      "Replay the captured proof through the delayed invalidation path.",
      "Observe release execution against the stale settlement branch."
    ],
    impactAssessment:
      "The issue can unlock bridge liquidity illegitimately and should be considered a direct fund-loss condition under realistic timing assumptions.",
    codeSnippet: `function validateDelayedProof(bytes32 root, bytes calldata proof) external {\n  if (accepted[root][keccak256(proof)]) {\n    releaseEscrow(proof);\n  }\n}`,
    screenshots: ["Bridge state diff", "Replay execution trace", "Escrow release event"],
    github: {
      url: "https://github.com/example/modular-bridge-poc",
      repo: "example/modular-bridge-poc",
      branch: "replay-window",
      updatedAt: "2 HOURS AGO"
    },
    internalNote: "Critical candidate. Compare against queue item BF-9876 for duplicate overlap."
  },
  {
    id: "BF-9881",
    severity: "HIGH",
    title: "Fallback oracle feed accepted after stale threshold breach",
    reporterAddress: "0x8be19aa41230",
    reporterReputation: 7.9,
    submittedAt: "Mar 21, 2026 | 18:42 UTC",
    aiScore: 8.1,
    status: "AI SCORED",
    recommendedPct: 60,
    tierReward: 10000,
    summaryRisk: "Price consumers may execute against stale but accepted fallback values.",
    subScores: [
      { label: "REPRO", value: 0.78 },
      { label: "IMPACT", value: 0.83 },
      { label: "NOVELTY", value: 0.72 },
      { label: "COMP", value: 0.8 },
      { label: "CVSS", value: 0.76 }
    ],
    evidencePills: ["POC CODE", "1 SCREENSHOT", "GITHUB LINK"],
    description:
      "The fallback feed remains routable after the primary feed exceeds its defined freshness bound. This allows liquidation or settlement consumers to execute against stale data before invalidation completes.",
    stepsToReproduce: [
      "Pause the primary feed beyond the freshness threshold.",
      "Trigger fallback routing through the recovery branch.",
      "Execute a liquidation call before invalidation finalizes."
    ],
    impactAssessment:
      "Stale-price execution can create unfair liquidations and incorrect solvency assumptions across dependent contracts.",
    codeSnippet: `if (block.timestamp - lastPrimaryUpdate > staleThreshold) {\n  activeFeed = fallbackFeed;\n}\nprice = activeFeed.read();`,
    screenshots: ["Fallback route selected"],
    github: {
      url: "https://github.com/example/oracle-fast-path-report",
      repo: "example/oracle-fast-path-report",
      branch: "stale-threshold",
      updatedAt: "10 HOURS AGO"
    }
  },
  {
    id: "BF-9802",
    severity: "HIGH",
    title: "Stale signer cache bypasses escrow policy rotation",
    reporterAddress: "0x19d0ff88aa90",
    reporterReputation: 8.1,
    submittedAt: "Mar 20, 2026 | 13:05 UTC",
    aiScore: 7.6,
    status: "UNDER REVIEW",
    recommendedPct: 60,
    tierReward: 9000,
    summaryRisk: "Payout authorization may reuse stale policy context after rotation.",
    subScores: [
      { label: "REPRO", value: 0.72 },
      { label: "IMPACT", value: 0.74 },
      { label: "NOVELTY", value: 0.69 },
      { label: "COMP", value: 0.77 },
      { label: "CVSS", value: 0.71 }
    ],
    evidencePills: ["POC CODE", "2 SCREENSHOTS", "GITHUB LINK"],
    description:
      "A signer cache survives an owner policy rotation event. If an old session is reused before invalidation, payout preparation can proceed against outdated authorization assumptions.",
    stepsToReproduce: [
      "Rotate the owner policy in the wallet coordinator.",
      "Reuse an existing signer session without refreshing the cache.",
      "Trigger payout preparation using the outdated session."
    ],
    impactAssessment:
      "The bug weakens escrow release guarantees and may permit unauthorized payout preparation paths under operational race conditions.",
    codeSnippet: `if (cachedSigner != address(0)) {\n  return cachedSigner;\n}\nreturn activePolicySigner;`,
    screenshots: ["Rotated policy screen", "Stale session replay"],
    github: {
      url: "https://github.com/example/wdk-cache-replay",
      repo: "example/wdk-cache-replay",
      branch: "stale-session",
      updatedAt: "1 DAY AGO"
    },
    internalNote: "Check whether session invalidation already landed on staging."
  },
  {
    id: "BF-9755",
    severity: "HIGH",
    title: "Approved payout disputed for higher completeness weighting",
    reporterAddress: "0x55af90c8137e",
    reporterReputation: 8.8,
    submittedAt: "Mar 19, 2026 | 16:30 UTC",
    aiScore: 8.4,
    status: "DISPUTE OPEN",
    recommendedPct: 80,
    tierReward: 9000,
    summaryRisk: "Researcher disputes partial payout decision after approval.",
    subScores: [
      { label: "REPRO", value: 0.84 },
      { label: "IMPACT", value: 0.78 },
      { label: "NOVELTY", value: 0.71 },
      { label: "COMP", value: 0.82 },
      { label: "CVSS", value: 0.77 }
    ],
    evidencePills: ["POC CODE", "GITHUB LINK"],
    description:
      "The submission was previously approved at 60%, but the researcher disputes the payout and requests 80% based on completeness and exploit realism.",
    stepsToReproduce: [
      "Review the prior approval notes and recommended AI weighting.",
      "Compare the attached exploit implementation against the expected completeness threshold.",
      "Resolve the dispute by accepting the claim or holding the original amount."
    ],
    impactAssessment:
      "No new technical risk. This item needs dispute resolution and payout confirmation.",
    codeSnippet: `// Prior PoC reference preserved in dispute packet\nprepareEscrowRelease(bundle, staleNonce);`,
    screenshots: ["Dispute packet summary"],
    github: {
      url: "https://github.com/example/dispute-poc",
      repo: "example/dispute-poc",
      branch: "final-report",
      updatedAt: "2 DAYS AGO"
    },
    disputeNote: {
      reason:
        "Researcher claims the PoC demonstrates a full exploit path and should be compensated at the AI-recommended percentage.",
      desiredPct: 80,
      approvedPct: 60
    }
  },
  {
    id: "BF-9735",
    severity: "MEDIUM",
    title: "Reserve accounting drift during Solana authority handoff",
    reporterAddress: "0x2ac9b18344d1",
    reporterReputation: 7.1,
    submittedAt: "Mar 19, 2026 | 07:48 UTC",
    aiScore: 7.1,
    status: "AI SCORED",
    recommendedPct: 40,
    tierReward: 4500,
    summaryRisk: "Temporary reserve mismatch under constrained operator timing.",
    subScores: [
      { label: "REPRO", value: 0.7 },
      { label: "IMPACT", value: 0.64 },
      { label: "NOVELTY", value: 0.6 },
      { label: "COMP", value: 0.73 },
      { label: "CVSS", value: 0.66 }
    ],
    evidencePills: ["POC CODE", "2 SCREENSHOTS"],
    description:
      "A liquidation reserve may drift briefly if strategy authority handoff overlaps with settlement accounting on Solana.",
    stepsToReproduce: [
      "Queue liquidation on an active reserve.",
      "Switch authority before reserve deltas settle.",
      "Inspect mismatch across strategy and reserve modules."
    ],
    impactAssessment:
      "The issue is operationally constrained and appears limited to temporary accounting inconsistency rather than direct loss.",
    codeSnippet: `if (pendingAuthority != currentAuthority) {\n  settleReserveDelta();\n  currentAuthority = pendingAuthority;\n}`,
    screenshots: ["Reserve delta mismatch", "Authority switch trace"],
    github: {
      url: "https://github.com/example/solana-authority-drift",
      repo: "example/solana-authority-drift",
      branch: "reserve-race",
      updatedAt: "18 HOURS AGO"
    }
  },
  {
    id: "BF-9604",
    severity: "MEDIUM",
    title: "Forced withdrawal griefing path awaiting mitigation validation",
    reporterAddress: "0x91c7aa901af4",
    reporterReputation: 8.0,
    submittedAt: "Mar 17, 2026 | 16:20 UTC",
    aiScore: 8.4,
    status: "FIX IN PROGRESS",
    recommendedPct: 80,
    tierReward: 8000,
    summaryRisk: "Team acknowledged liveness issue and is preparing the patch.",
    subScores: [
      { label: "REPRO", value: 0.88 },
      { label: "IMPACT", value: 0.79 },
      { label: "NOVELTY", value: 0.68 },
      { label: "COMP", value: 0.86 },
      { label: "CVSS", value: 0.74 }
    ],
    evidencePills: ["POC CODE", "1 SCREENSHOT", "GITHUB LINK"],
    description:
      "A forced withdrawal queue can be griefed through repeated low-cost challenge submissions, delaying exit processing until mitigations are applied.",
    stepsToReproduce: [
      "Create a withdrawal batch near the challenge threshold.",
      "Issue repeated low-cost challenges over consecutive windows.",
      "Observe the resulting forced reprocessing loop."
    ],
    impactAssessment:
      "The issue degrades bridge liveness significantly and is likely payout-worthy once mitigation validation is complete.",
    codeSnippet: `while (challengeWindowOpen(batchId)) {\n  queueRetry(batchId);\n  batch.status = Status.Pending;\n}`,
    screenshots: ["Challenge spam loop"],
    github: {
      url: "https://github.com/example/l2-griefing-report",
      repo: "example/l2-griefing-report",
      branch: "challenge-loop",
      updatedAt: "3 DAYS AGO"
    }
  }
];

export function getAdminSubmissionById(id: string) {
  return adminSubmissions.find((submission) => submission.id === id) ?? null;
}
