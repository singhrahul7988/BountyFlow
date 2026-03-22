"use client";

import { useMemo } from "react";

import {
  adminSubmissions as seededAdminSubmissions,
  type AdminSubmission
} from "@/lib/admin-submissions-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { useAuthenticatedDemoStateSync } from "@/lib/use-demo-sync";
import { AdminSubmissionDetailView } from "./admin-submission-detail-view";

export function AdminSubmissionDetailResolver({ id }: { id: string }) {
  const hasLoaded = useAuthenticatedDemoStateSync(true);
  const demoAdminSubmissions = useDemoDataStore((state) => state.demoAdminSubmissions);

  const submission = useMemo<AdminSubmission | null>(() => {
    return (
      demoAdminSubmissions.find((item) => item.id === id) ??
      seededAdminSubmissions.find((item) => item.id === id) ??
      null
    );
  }, [demoAdminSubmissions, id]);

  if (!submission) {
    if (!hasLoaded) {
      return (
        <section className="p-6 md:p-8 xl:p-10">
          <div className="max-w-5xl space-y-6 bg-surface-high p-8 md:p-10">
            <p className="bf-label text-primary">RESOLVING SUBMISSION</p>
            <h1 className="bf-display text-[2.5rem] leading-none tracking-tightHeading sm:text-[3.4rem]">
              LOADING
              <span className="block">REVIEW</span>
            </h1>
          </div>
        </section>
      );
    }

    return (
      <section className="p-6 md:p-8 xl:p-10">
        <div className="max-w-5xl space-y-6 bg-surface-high p-8 md:p-10">
          <p className="bf-label text-primary">SUBMISSION NOT FOUND</p>
          <h1 className="bf-display text-[2.5rem] leading-none tracking-tightHeading sm:text-[3.4rem]">
            UNKNOWN
            <span className="block">REPORT</span>
          </h1>
          <p className="max-w-3xl text-[1rem] leading-8 text-muted">
            The requested owner review item does not exist in the seeded dataset or current demo session.
          </p>
        </div>
      </section>
    );
  }

  return <AdminSubmissionDetailView submission={submission} />;
}
