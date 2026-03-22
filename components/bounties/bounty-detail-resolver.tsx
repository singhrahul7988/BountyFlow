"use client";

import { useMemo } from "react";

import type { BountyDetail } from "@/lib/bounty-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { BountyDetailPageContent } from "./bounty-detail-page-content";

export function BountyDetailResolver({
  slug,
  initialBounty
}: {
  slug: string;
  initialBounty: BountyDetail | null;
}) {
  const createdBounties = useDemoDataStore((state) => state.createdBounties);

  const bounty = useMemo(
    () => initialBounty ?? createdBounties.find((item) => item.slug === slug) ?? null,
    [createdBounties, initialBounty, slug]
  );

  if (!bounty) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="bf-shell pt-32 pb-24">
          <div className="max-w-4xl bg-surface-low p-8 md:p-10">
            <p className="bf-label text-primary">PROGRAM NOT FOUND</p>
            <h1 className="bf-display mt-5 text-[2.2rem] leading-none tracking-tightHeading sm:text-[3.4rem]">
              UNKNOWN
              <span className="block">BOUNTY</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[1rem] leading-8 text-muted">
              This bounty does not exist in the seeded dataset or the current demo session.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return <BountyDetailPageContent bounty={bounty} />;
}
