"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BountyCard } from "@/components/home/bounty-card";
import type { BountyDetail } from "@/lib/bounty-data";
import { createRemoteDemoBounty } from "@/lib/demo-api";
import type { BountyCardData } from "@/lib/mock-data";
import { useAppStore } from "@/lib/stores/app-store";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { formatCurrency, truncateAddress } from "@/lib/utils";

const severityOptions = [
  { value: "critical", label: "CRITICAL", color: "border-danger/30 bg-danger/10 text-danger" },
  { value: "high", label: "HIGH", color: "border-amber/30 bg-amber/10 text-amber" },
  { value: "medium", label: "MEDIUM", color: "border-indigo/30 bg-indigo/10 text-indigo" },
  { value: "low", label: "LOW", color: "border-outline/25 bg-surface-high text-muted" }
] as const;

const rewardRows = [
  { key: "critical", label: "CRITICAL", accent: "text-danger" },
  { key: "high", label: "HIGH", accent: "text-amber" },
  { key: "medium", label: "MEDIUM", accent: "text-indigo" },
  { key: "low", label: "LOW", accent: "text-muted" }
] as const;

type RewardKey = (typeof rewardRows)[number]["key"];

const defaultRewards: Record<RewardKey, number> = {
  critical: 25000,
  high: 12000,
  medium: 6000,
  low: 2500
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function platformLabelFromUrl(url: string) {
  if (!url.trim()) {
    return "NEW PROGRAM";
  }

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.toUpperCase();
  } catch {
    return "PROJECT URL";
  }
}

function derivePreviewSeverity(levels: string[]): BountyCardData["severity"] {
  if (levels.includes("critical")) {
    return "featured";
  }

  if (levels.includes("high")) {
    return "high";
  }

  return "open";
}

export function AdminCreateBounty() {
  const { currentUser } = useAppStore();
  const addCreatedBounty = useDemoDataStore((state) => state.addCreatedBounty);
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [form, setForm] = useState({
    title: "ETHEREUM L2 BRIDGE AUDIT",
    projectUrl: "https://bridge.example.com",
    shortDescription:
      "Cross-domain settlement, delayed proof verification, and escrow release logic across L2 bridge contracts.",
    scope:
      "Bridge router, relayer verification, stale root invalidation, escrow release guards, settlement accounting, signer rotation modules.",
    acceptedSeverities: ["critical", "high", "medium"] as string[],
    rewardCritical: defaultRewards.critical,
    rewardHigh: defaultRewards.high,
    rewardMedium: defaultRewards.medium,
    rewardLow: defaultRewards.low,
    minAiNotifyScore: 5,
    autoRejectBelow: 3,
    evaluationCriteria:
      "Prioritize exploitability, direct fund-risk, replay conditions, stale state acceptance, and proof invalidation logic."
  });

  const totalDeposit = useMemo(
    () => form.rewardCritical + form.rewardHigh + form.rewardMedium + form.rewardLow,
    [form.rewardCritical, form.rewardHigh, form.rewardMedium, form.rewardLow]
  );

  const slug = useMemo(() => slugify(form.title) || "pending-slug", [form.title]);
  const previewUrl = isPublished ? `bountyflow.xyz/b/${slug}` : "bountyflow.xyz/b/[slug]";
  const connectedWallet =
    currentUser?.walletLinked && currentUser.walletAddress ? currentUser.walletAddress : null;
  const mockWalletBalance = 186400;

  const previewCard = useMemo<BountyCardData>(
    () => ({
      slug,
      title: form.title || "UNTITLED PROGRAM",
      platform: platformLabelFromUrl(form.projectUrl),
      rewardPool: totalDeposit,
      tiers: [
        ...form.acceptedSeverities.map((item) => item.toUpperCase()),
        "USDT",
        "ESCROW"
      ].slice(0, 4),
      submissionCount: 0,
      status: isPublished ? "LIVE NOW" : "PREVIEW ONLY",
      severity: derivePreviewSeverity(form.acceptedSeverities),
      description:
        form.shortDescription || "Add a concise summary to preview the public listings card.",
      ctaLabel: isPublished ? "VIEW BOUNTY" : "PREVIEW",
      href: isPublished ? `/bounty/${slug}` : "#"
    }),
    [
      form.acceptedSeverities,
      form.projectUrl,
      form.shortDescription,
      form.title,
      isPublished,
      slug,
      totalDeposit
    ]
  );

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setIsPublished(false);
    setPublishError("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSeverity(level: string) {
    setIsPublished(false);
    setPublishError("");
    setForm((current) => {
      const isActive = current.acceptedSeverities.includes(level);

      return {
        ...current,
        acceptedSeverities: isActive
          ? current.acceptedSeverities.filter((item) => item !== level)
          : [...current.acceptedSeverities, level]
      };
    });
  }

  async function handlePublish() {
    if (isPublishing) {
      return;
    }

    const createdBounty: BountyDetail = {
      id: `custom-${slug}`,
      slug,
      title: form.title || "UNTITLED PROGRAM",
      platform: platformLabelFromUrl(form.projectUrl),
      platformType: "INFRA",
      platformUrl: form.projectUrl || "https://bountyflow.local",
      shortDescription:
        form.shortDescription || "Owner-created bounty now active in demo mode.",
      description:
        form.shortDescription || "Owner-created bounty now active in demo mode.",
      severity: derivePreviewSeverity(form.acceptedSeverities),
      rewardPool: totalDeposit,
      rewardTiers: {
        critical: form.rewardCritical,
        high: form.rewardHigh,
        medium: form.rewardMedium,
        low: form.rewardLow,
        informational: 500
      },
      submissionCount: 0,
      resolvedCount: 0,
      activeCount: 0,
      escrowBalance: totalDeposit,
      escrowAddress: connectedWallet ?? "WALLET-LINK-REQUIRED",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      tags: [
        ...form.acceptedSeverities.map((item) => item.toUpperCase()),
        "USDT",
        "ESCROW",
        "LIVE"
      ].slice(0, 4),
      acceptedSeverities: form.acceptedSeverities.map((item) => item.toUpperCase()) as BountyDetail["acceptedSeverities"],
      acceptedEvidenceTypes: ["Code files", "Screenshots", "GitHub links", "PDF writeups"],
      scopeIn: form.scope
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      scopeOut: ["Out-of-scope items not yet defined by owner."],
      severityDefinitions: [
        { label: "CRITICAL", definition: "Direct fund loss or systemic compromise." },
        { label: "HIGH", definition: "Meaningful privilege abuse or payout bypass." },
        { label: "MEDIUM", definition: "Constrained exploit path with real security relevance." },
        { label: "LOW", definition: "Low-impact validation or logic issue." }
      ],
      rules: [
        "Provide clear reproduction steps and evidence.",
        "Do not disclose findings publicly before triage.",
        "Use isolated wallets and test environments where possible."
      ],
      recentActivity: [
        {
          id: `${slug}-launch`,
          label: "OWNER FUNDED ESCROW AND LAUNCHED THE PROGRAM",
          timestamp: "JUST NOW",
          outcome: "LIVE"
        }
      ]
    };

    setIsPublishing(true);
    setPublishError("");

    try {
      const remoteBounty = await createRemoteDemoBounty(createdBounty);
      addCreatedBounty(remoteBounty);
      setIsPublished(true);
    } catch (error) {
      addCreatedBounty(createdBounty);
      setIsPublished(true);
      setPublishError(
        error instanceof Error
          ? `${error.message} Falling back to local demo persistence for this session.`
          : "Remote persistence failed. Falling back to local demo persistence for this session."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <section className="p-4 md:p-5 xl:p-6">
      <div className="space-y-4">
        <div className="space-y-2.5">
          <p className="bf-label text-primary">PROGRAM CREATION</p>
          <h1 className="bf-display text-[1.65rem] leading-none tracking-tightHeading sm:text-[2.2rem]">
            CREATE
            <span className="block">BOUNTY</span>
          </h1>
          <p className="max-w-3xl text-[0.76rem] leading-6 text-muted">
            Configure the bounty, reward tiers, and AI routing thresholds, then arm escrow for a
            live launch.
          </p>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div className="space-y-3">
            <section className="space-y-4 bg-surface-high p-3.5 md:p-4">
              <div className="space-y-2">
                <p className="bf-label text-primary">SECTION 1</p>
                <h2 className="bf-display text-[1rem] leading-none tracking-tightHeading">
                  BOUNTY DETAILS
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-3 md:col-span-2">
                  <span className="bf-label text-foreground">BOUNTY TITLE</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    className="bf-terminal-input"
                    placeholder="Enter the bounty title"
                  />
                </label>

                <label className="space-y-3 md:col-span-2">
                  <span className="bf-label text-foreground">PLATFORM / PROJECT URL</span>
                  <input
                    value={form.projectUrl}
                    onChange={(event) => updateField("projectUrl", event.target.value)}
                    className="bf-terminal-input"
                    placeholder="https://project.xyz"
                  />
                </label>

                <label className="space-y-3 md:col-span-2">
                  <span className="bf-label text-foreground">SHORT DESCRIPTION</span>
                  <textarea
                    value={form.shortDescription}
                    onChange={(event) => updateField("shortDescription", event.target.value)}
                    className="bf-terminal-input min-h-[96px] resize-y"
                    placeholder="Short public description for the bounty listing."
                  />
                </label>

                <label className="space-y-3 md:col-span-2">
                  <span className="bf-label text-foreground">SCOPE</span>
                  <textarea
                    value={form.scope}
                    onChange={(event) => updateField("scope", event.target.value)}
                    className="bf-terminal-input min-h-[116px] resize-y"
                    placeholder="Describe the systems, contracts, or modules in scope."
                  />
                </label>

                <div className="space-y-3 md:col-span-2">
                  <span className="bf-label text-foreground">ACCEPTED SEVERITY LEVELS</span>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {severityOptions.map((option) => {
                      const active = form.acceptedSeverities.includes(option.value);

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleSeverity(option.value)}
                          className={`border px-3 py-3 text-left transition-colors duration-100 ease-linear ${
                            active
                              ? option.color
                              : "border-outline/20 bg-background text-muted hover:bg-surface-low"
                          }`}
                        >
                          <p className="bf-label">{option.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="space-y-4 bg-surface-high p-3.5 md:p-4">
                <div className="space-y-2">
                  <p className="bf-label text-primary">SECTION 3</p>
                  <h2 className="bf-display text-[1.08rem] leading-none tracking-tightHeading">
                    AI EVALUATION
                  </h2>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="bf-label text-foreground">EXPANDED CONTROLS</p>
                  <button
                    type="button"
                    onClick={() => setIsAiOpen((current) => !current)}
                    className="bf-button-tertiary"
                  >
                    {isAiOpen ? "COLLAPSE" : "EXPAND"}
                  </button>
                </div>

                {isAiOpen ? (
                  <div className="space-y-4">
                    <label className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="bf-label text-foreground">MIN AI SCORE TO NOTIFY ADMIN</span>
                        <span className="bf-data text-[0.86rem] text-primary">
                          {form.minAiNotifyScore.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={0.5}
                        value={form.minAiNotifyScore}
                        onChange={(event) =>
                          updateField("minAiNotifyScore", Number(event.target.value))
                        }
                        className="w-full accent-[#6effc0]"
                      />
                    </label>

                    <label className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="bf-label text-foreground">AUTO-REJECT BELOW SCORE</span>
                        <span className="bf-data text-[0.86rem] text-amber">
                          {form.autoRejectBelow.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={form.autoRejectBelow}
                        onChange={(event) =>
                          updateField("autoRejectBelow", Number(event.target.value))
                        }
                        className="w-full accent-[#F59E0B]"
                      />
                    </label>

                    <label className="space-y-3">
                      <span className="bf-label text-foreground">EVALUATION CRITERIA</span>
                      <textarea
                        value={form.evaluationCriteria}
                        onChange={(event) => updateField("evaluationCriteria", event.target.value)}
                        className="bf-terminal-input min-h-[106px] resize-y"
                        placeholder="Plain-English instructions that guide AI evaluation."
                      />
                    </label>
                  </div>
                ) : null}
              </section>

              <section className="space-y-4 bg-surface-high p-3.5 md:p-4">
                <div className="space-y-2">
                  <p className="bf-label text-primary">SECTION 4</p>
                  <h2 className="bf-display text-[1.08rem] leading-none tracking-tightHeading">
                    FUND ESCROW
                  </h2>
                </div>

                <div className="grid gap-4 bg-background p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="bf-label">YOU WILL DEPOSIT</p>
                      <p className="bf-data text-[1.35rem] text-primary">
                        {formatCurrency(totalDeposit, 0)} USDT
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="bf-label">AVAILABLE BALANCE</p>
                      <p className="bf-data text-[0.86rem] text-primary">
                        {formatCurrency(mockWalletBalance, 0)} USDT
                      </p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <p className="bf-label">CONNECTED WALLET</p>
                      <p className="bf-data text-[0.82rem] text-foreground">
                        {connectedWallet ? truncateAddress(connectedWallet) : "NOT LINKED"}
                      </p>
                    </div>
                  </div>

                  <p className="text-[0.76rem] leading-6 text-muted">
                    Funding arms the escrow pool for this bounty and updates the persisted treasury
                    flow used by the owner review lifecycle.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublish}
                  className="bf-button-primary w-full justify-center"
                  disabled={isPublishing}
                >
                  {isPublishing ? "PUBLISHING..." : "FUND ESCROW & GO LIVE"}
                  <span aria-hidden="true">-&gt;</span>
                </button>

                {isPublished ? (
                  <div className="border border-primary/25 bg-primary/10 p-4">
                    <p className="bf-label text-primary">PROGRAM ARMED</p>
                    <p className="mt-2 text-[0.8rem] leading-6 text-foreground">
                      The bounty preview is now in live mode for the demo. Share slug:
                      <span className="ml-2 bf-data text-primary">{previewUrl}</span>
                    </p>
                  </div>
                ) : null}
                {publishError ? <p className="text-[0.76rem] leading-6 text-amber">{publishError}</p> : null}
              </section>
            </div>

            <section className="space-y-4 bg-surface-high p-3.5 md:p-4">
              <div className="space-y-2">
                <p className="bf-label text-primary">SECTION 2</p>
                <h2 className="bf-display text-[1rem] leading-none tracking-tightHeading">
                  REWARD TIERS
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {rewardRows.map((row) => {
                  const fieldName = `reward${row.label[0]}${row.label.slice(1).toLowerCase()}` as keyof typeof form;

                  return (
                    <label
                      key={row.key}
                      className="space-y-2 bg-background p-3"
                    >
                      <span className={`bf-label ${row.accent}`}>{row.label}</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={form[fieldName] as number}
                        onChange={(event) =>
                          updateField(fieldName, Math.max(0, Number(event.target.value) || 0))
                        }
                        className="bf-terminal-input"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 bg-background p-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <p className="bf-label">TOTAL ESCROW REQUIRED</p>
                  <p className="bf-data text-[1.2rem] text-primary">
                    {formatCurrency(totalDeposit, 0)} USDT
                  </p>
                </div>
                <p className="max-w-md text-[0.72rem] leading-5 text-muted">
                  Rewards update live as tiers change.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:pt-[1px]">
            <div className="space-y-4 bg-surface-high p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="bf-label text-primary">LIVE PREVIEW</p>
                <span className="bf-label text-muted">
                  {isPublished ? "LIVE MODE" : "DRAFT MODE"}
                </span>
              </div>

              <BountyCard {...previewCard} compact />

              <div className="space-y-4 bg-background p-4">
                <div className="space-y-2">
                  <p className="bf-label">SHARE LINK</p>
                  <p
                    className={`bf-data text-[0.78rem] ${
                      isPublished ? "text-primary" : "text-muted"
                    }`}
                  >
                    {previewUrl}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="bf-label">IN SCOPE</p>
                  <p className="text-[0.76rem] leading-6 text-muted">{form.scope}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="bf-label">AI NOTIFY</p>
                    <p className="bf-data text-[0.92rem] text-primary">
                      {form.minAiNotifyScore.toFixed(1)}+
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="bf-label">AUTO-REJECT</p>
                    <p className="bf-data text-[0.92rem] text-amber">
                      BELOW {form.autoRejectBelow.toFixed(1)}
                    </p>
                  </div>
                </div>

                {isPublished ? (
                  <Link href="/bounties" className="bf-button-secondary">
                    VIEW PUBLIC LISTING
                  </Link>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
