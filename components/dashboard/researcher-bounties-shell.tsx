"use client";

import { BountiesExplorerShell } from "@/components/bounties/bounties-explorer-shell";
import { bounties } from "@/lib/bounty-data";
import { ResearcherDashboardShell } from "./researcher-dashboard-shell";

export function ResearcherBountiesShell() {
  return (
    <ResearcherDashboardShell
      externalPage={{
        eyebrow: "ACTIVE BOUNTY INDEX",
        title: "ACTIVE BOUNTIES",
        description:
          "Browse verified programs by severity, reward, and platform category without leaving the researcher dashboard.",
        content: <BountiesExplorerShell items={bounties} hrefBase="/bounty" />
      }}
    />
  );
}
