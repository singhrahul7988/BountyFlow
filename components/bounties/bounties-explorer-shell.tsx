"use client";

import { useMemo } from "react";

import type { BountyDetail } from "@/lib/bounty-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { BountiesExplorer } from "./bounties-explorer";

export function BountiesExplorerShell({ items }: { items: BountyDetail[] }) {
  const createdBounties = useDemoDataStore((state) => state.createdBounties);

  const mergedItems = useMemo(() => {
    const seen = new Set<string>();
    const next = [...createdBounties, ...items].filter((item) => {
      if (seen.has(item.slug)) {
        return false;
      }

      seen.add(item.slug);
      return true;
    });

    return next;
  }, [createdBounties, items]);

  return <BountiesExplorer items={mergedItems} />;
}
