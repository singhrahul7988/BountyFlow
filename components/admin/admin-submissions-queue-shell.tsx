"use client";

import { useMemo } from "react";

import { resolveOwnerProgram } from "@/lib/admin-data";
import {
  adminSubmissions as seededAdminSubmissions,
  type AdminSubmission
} from "@/lib/admin-submissions-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { AdminSubmissionsQueue } from "./admin-submissions-queue";

export function AdminSubmissionsQueueShell() {
  const createdBounties = useDemoDataStore((state) => state.createdBounties);
  const demoAdminSubmissions = useDemoDataStore((state) => state.demoAdminSubmissions);
  const ownerProgram = useMemo(() => resolveOwnerProgram(createdBounties), [createdBounties]);

  const items = useMemo<AdminSubmission[]>(() => {
    const seen = new Set<string>();
    return [...demoAdminSubmissions, ...seededAdminSubmissions]
      .filter(
        (item) =>
          item.bountySlug === ownerProgram.slug ||
          item.bountyName.toUpperCase() === ownerProgram.name.toUpperCase()
      )
      .filter((item) => {
        if (seen.has(item.id)) {
          return false;
        }

        seen.add(item.id);
        return true;
      });
  }, [demoAdminSubmissions, ownerProgram]);

  return <AdminSubmissionsQueue items={items} />;
}
