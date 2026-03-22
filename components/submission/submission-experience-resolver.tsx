"use client";

import type { BountyDetail } from "@/lib/bounty-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { usePublicBountiesSync } from "@/lib/use-demo-sync";
import { SubmissionExperience } from "./submission-experience";

export function SubmissionExperienceResolver({
  slug,
  initialBounty
}: {
  slug: string;
  initialBounty: BountyDetail | null;
}) {
  const createdBounties = useDemoDataStore((state) => state.createdBounties);
  const hasLoaded = usePublicBountiesSync();
  const bounty = initialBounty ?? createdBounties.find((item) => item.slug === slug) ?? null;

  if (!bounty) {
    if (!hasLoaded) {
      return (
        <section className="bf-shell pt-32 pb-24">
          <div className="max-w-4xl bg-surface-low p-8 md:p-10">
            <p className="bf-label text-primary">RESOLVING BOUNTY</p>
            <h1 className="bf-display mt-5 text-[2.2rem] leading-none tracking-tightHeading sm:text-[3.4rem]">
              LOADING
              <span className="block">SUBMISSION FLOW</span>
            </h1>
          </div>
        </section>
      );
    }

    return (
      <section className="bf-shell pt-32 pb-24">
        <div className="max-w-4xl bg-surface-low p-8 md:p-10">
          <p className="bf-label text-primary">BOUNTY NOT FOUND</p>
          <h1 className="bf-display mt-5 text-[2.2rem] leading-none tracking-tightHeading sm:text-[3.4rem]">
            SUBMISSION
            <span className="block">UNAVAILABLE</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[1rem] leading-8 text-muted">
            This bounty does not exist in the seeded dataset or current demo session.
          </p>
        </div>
      </section>
    );
  }

  return <SubmissionExperience bounty={bounty} />;
}
