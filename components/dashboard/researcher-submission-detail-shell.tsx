"use client";

import { useMemo } from "react";

import { researcherSubmissions, type ResearcherSubmission } from "@/lib/dashboard-data";
import { useAppStore } from "@/lib/stores/app-store";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { useAuthenticatedDemoStateSync } from "@/lib/use-demo-sync";
import { ResearcherSubmissionDetailResolver } from "./researcher-submission-detail-resolver";

export function ResearcherSubmissionDetailShell({ id }: { id: string }) {
  const currentUser = useAppStore((state) => state.currentUser);
  const hasLoaded = useAuthenticatedDemoStateSync(currentUser?.role === "researcher");
  const demoResearcherSubmissions = useDemoDataStore((state) => state.demoResearcherSubmissions);

  const submission = useMemo<ResearcherSubmission | null>(() => {
    return (
      demoResearcherSubmissions.find((item) => item.id === id) ??
      researcherSubmissions.find((item) => item.id === id) ??
      null
    );
  }, [demoResearcherSubmissions, id]);

  if (!submission) {
    if (!hasLoaded) {
      return (
        <section className="bf-shell pt-32 pb-24">
          <div className="max-w-4xl bg-surface-low p-8 md:p-10">
            <p className="bf-label text-primary">RESOLVING SUBMISSION</p>
            <h1 className="bf-display mt-5 text-[2.2rem] leading-none tracking-tightHeading sm:text-[3.4rem]">
              LOADING
              <span className="block">DETAIL</span>
            </h1>
          </div>
        </section>
      );
    }

    return (
      <section className="bf-shell pt-32 pb-24">
        <div className="max-w-4xl bg-surface-low p-8 md:p-10">
          <p className="bf-label text-primary">SUBMISSION NOT FOUND</p>
          <h1 className="bf-display mt-5 text-[2.2rem] leading-none tracking-tightHeading sm:text-[3.4rem]">
            UNKNOWN
            <span className="block">SUBMISSION</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[1rem] leading-8 text-muted">
            This researcher submission does not exist in the seeded dataset or current demo session.
          </p>
        </div>
      </section>
    );
  }

  return <ResearcherSubmissionDetailResolver submission={submission} />;
}
