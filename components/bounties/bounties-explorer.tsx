"use client";

import { useMemo, useState } from "react";

import { getAuthHref } from "@/lib/auth";
import type { BountyDetail } from "@/lib/bounty-data";
import { BountyCard } from "@/components/home/bounty-card";
import { TerminalSelect } from "@/components/ui/terminal-select";

const severityFilters = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const rewardFilters = ["ANY", "UNDER_50K", "BETWEEN_50K_75K", "ABOVE_75K"] as const;
const platformFilters = ["ALL", "DEFI", "INFRA", "L2", "WALLET", "ORACLE"] as const;
const sortOptions = ["NEWEST", "HIGHEST_REWARD", "MOST_ACTIVE"] as const;

export function BountiesExplorer({ items }: { items: BountyDetail[] }) {
  const [severity, setSeverity] = useState<(typeof severityFilters)[number]>("ALL");
  const [rewardRange, setRewardRange] = useState<(typeof rewardFilters)[number]>("ANY");
  const [platform, setPlatform] = useState<(typeof platformFilters)[number]>("ALL");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]>("NEWEST");

  const filteredItems = useMemo(() => {
    const nextItems = items.filter((item) => {
      const matchesSeverity =
        severity === "ALL" || item.acceptedSeverities.includes(severity);

      const matchesReward =
        rewardRange === "ANY" ||
        (rewardRange === "UNDER_50K" && item.rewardPool < 50000) ||
        (rewardRange === "BETWEEN_50K_75K" && item.rewardPool >= 50000 && item.rewardPool <= 75000) ||
        (rewardRange === "ABOVE_75K" && item.rewardPool > 75000);

      const matchesPlatform = platform === "ALL" || item.platformType === platform;

      return matchesSeverity && matchesReward && matchesPlatform;
    });

    return nextItems.sort((left, right) => {
      if (sortBy === "HIGHEST_REWARD") {
        return right.rewardPool - left.rewardPool;
      }

      if (sortBy === "MOST_ACTIVE") {
        return right.submissionCount - left.submissionCount;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [items, platform, rewardRange, severity, sortBy]);

  return (
    <div className="space-y-7">
      <div className="bf-panel grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_0.9fr]">
        <label className="space-y-2">
          <span className="bf-label">SEVERITY</span>
          <TerminalSelect
            value={severity}
            onChange={(nextValue) => setSeverity(nextValue as (typeof severityFilters)[number])}
            options={severityFilters.map((filterValue) => ({
              label: filterValue.replaceAll("_", " "),
              value: filterValue
            }))}
            ariaLabel="Severity filter"
            buttonClassName="px-4 py-3 text-[0.78rem]"
          />
        </label>

        <label className="space-y-2">
          <span className="bf-label">REWARD RANGE</span>
          <TerminalSelect
            value={rewardRange}
            onChange={(nextValue) => setRewardRange(nextValue as (typeof rewardFilters)[number])}
            options={[
              { value: "ANY", label: "ANY" },
              { value: "UNDER_50K", label: "UNDER 50K" },
              { value: "BETWEEN_50K_75K", label: "50K TO 75K" },
              { value: "ABOVE_75K", label: "ABOVE 75K" }
            ]}
            ariaLabel="Reward range filter"
            buttonClassName="px-4 py-3 text-[0.78rem]"
          />
        </label>

        <label className="space-y-2">
          <span className="bf-label">PLATFORM TYPE</span>
          <TerminalSelect
            value={platform}
            onChange={(nextValue) => setPlatform(nextValue as (typeof platformFilters)[number])}
            options={platformFilters.map((filterValue) => ({
              label: filterValue,
              value: filterValue
            }))}
            ariaLabel="Platform type filter"
            buttonClassName="px-4 py-3 text-[0.78rem]"
          />
        </label>

        <label className="space-y-2">
          <span className="bf-label">SORT</span>
          <TerminalSelect
            value={sortBy}
            onChange={(nextValue) => setSortBy(nextValue as (typeof sortOptions)[number])}
            options={[
              { value: "NEWEST", label: "NEWEST" },
              { value: "HIGHEST_REWARD", label: "HIGHEST REWARD" },
              { value: "MOST_ACTIVE", label: "MOST ACTIVE" }
            ]}
            ariaLabel="Sort bounties"
            buttonClassName="px-4 py-3 text-[0.78rem]"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="bf-label text-[0.62rem] text-foreground">
          {filteredItems.length} ACTIVE PROGRAMS MATCH CURRENT FILTERS
        </p>
        <p className="bf-label">ESCROW VERIFIED PROGRAMS ONLY</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <BountyCard
            key={item.id}
            slug={item.slug}
            href={getAuthHref("researcher", `/bounty/${item.slug}`)}
            title={item.title}
            platform={item.platform}
            rewardPool={item.rewardPool}
            tiers={item.tags}
            submissionCount={item.submissionCount}
            status={item.status}
            severity={item.severity}
            description={item.shortDescription}
            ctaLabel="VIEW BOUNTY"
            compact
          />
        ))}
      </div>
    </div>
  );
}
