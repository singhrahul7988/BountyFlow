"use client";

import { useMemo } from "react";

import { resolveOwnerProgram } from "@/lib/admin-data";
import {
  adminSubmissions as seededAdminSubmissions,
  type AdminSubmission
} from "@/lib/admin-submissions-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { useAuthenticatedDemoStateSync } from "@/lib/use-demo-sync";
import { AdminSubmissionDetailView } from "./admin-submission-detail-view";

export function AdminSubmissionDetailResolver({ id }: { id: string }) {
  const hasLoaded = useAuthenticatedDemoStateSync(true);
  const createdBounties = useDemoDataStore((state) => state.createdBounties);
  const demoAdminSubmissions = useDemoDataStore((state) => state.demoAdminSubmissions);
  const ownerProgram = useMemo(() => resolveOwnerProgram(createdBounties), [createdBounties]);

  const submission = useMemo<AdminSubmission | null>(() => {
    const resolved =
      demoAdminSubmissions.find((item) => item.id === id) ??
      seededAdminSubmissions.find((item) => item.id === id) ??
      null;

    if (!resolved) {
      return null;
    }

    return resolved.bountySlug === ownerProgram.slug ||
      resolved.bountyName.toUpperCase() === ownerProgram.name.toUpperCase()
      ? resolved
      : null;
  }, [demoAdminSubmissions, id, ownerProgram]);

  if (!submission) {
    if (!hasLoaded) {
      return (
        <section className="p-4 md:p-5 xl:p-6">
          <div className="max-w-4xl space-y-4 bg-surface-high p-5 md:p-6">
            <p className="bf-label text-primary">RESOLVING SUBMISSION</p>
            <h1 className="bf-display text-[1.95rem] leading-none tracking-tightHeading sm:text-[2.6rem]">
              LOADING
              <span className="block">REVIEW</span>
            </h1>
          </div>
        </section>
      );
    }

    return (
      <section className="p-4 md:p-5 xl:p-6">
        <div className="max-w-4xl space-y-4 bg-surface-high p-5 md:p-6">
          <p className="bf-label text-primary">SUBMISSION NOT FOUND</p>
          <h1 className="bf-display text-[1.95rem] leading-none tracking-tightHeading sm:text-[2.6rem]">
            UNKNOWN
            <span className="block">REPORT</span>
          </h1>
          <p className="max-w-3xl text-[0.84rem] leading-7 text-muted">
            The requested owner review item does not exist in the seeded dataset or current demo session.
          </p>
        </div>
      </section>
    );
  }

  return <AdminSubmissionDetailView submission={submission} />;
}
