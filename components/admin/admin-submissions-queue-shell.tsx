"use client";

import { useMemo } from "react";

import {
  adminSubmissions as seededAdminSubmissions,
  type AdminSubmission
} from "@/lib/admin-submissions-data";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { AdminSubmissionsQueue } from "./admin-submissions-queue";

export function AdminSubmissionsQueueShell() {
  const demoAdminSubmissions = useDemoDataStore((state) => state.demoAdminSubmissions);

  const items = useMemo<AdminSubmission[]>(() => {
    const seen = new Set<string>();
    return [...demoAdminSubmissions, ...seededAdminSubmissions].filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    });
  }, [demoAdminSubmissions]);

  return <AdminSubmissionsQueue items={items} />;
}
