"use client";

import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { AdminNotification } from "@/lib/admin-notifications-data";
import type {
  TreasuryAllocationRow,
  TreasuryChartPoint,
  TreasuryTransaction
} from "@/lib/admin-treasury-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import type {
  PersistedSubmissionPayload,
  SubmissionDecision,
  SubmissionDisputeNote
} from "@/lib/demo-types";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as (T & { error?: string }) | null;

  if (!response.ok) {
    throw new Error(body?.error || "Request failed.");
  }

  if (!body) {
    throw new Error("Empty response body.");
  }

  return body;
}

export async function fetchPublicDemoBounties() {
  const body = await parseResponse<{ items: BountyDetail[] }>(
    await fetch("/api/bounties", { cache: "no-store" })
  );
  return body.items;
}

export async function createRemoteDemoBounty(bounty: BountyDetail) {
  const body = await parseResponse<{ item: BountyDetail }>(
    await fetch("/api/bounties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ bounty })
    })
  );

  return body.item;
}

export async function fetchRemoteDemoState() {
  return parseResponse<{
    bounties: BountyDetail[];
    adminSubmissions: AdminSubmission[];
    researcherSubmissions: ResearcherSubmission[];
    decisions: Record<string, SubmissionDecision>;
    notifications: AdminNotification[];
  }>(await fetch("/api/demo-state", { cache: "no-store" }));
}

export async function createRemoteDemoSubmission(payload: {
  adminSubmission: AdminSubmission;
  researcherSubmission: ResearcherSubmission;
}) {
  return parseResponse<PersistedSubmissionPayload>(
    await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function updateRemoteSubmissionDecision(
  id: string,
  decision: SubmissionDecision
) {
  return parseResponse<PersistedSubmissionPayload>(
    await fetch(`/api/submissions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(decision)
    })
  );
}

export async function openRemoteSubmissionDispute(
  id: string,
  dispute: Pick<SubmissionDisputeNote, "reason" | "desiredPct" | "justification">
) {
  return parseResponse<PersistedSubmissionPayload>(
    await fetch(`/api/submissions/${id}/dispute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dispute)
    })
  );
}

export async function resolveRemoteSubmissionDispute(
  id: string,
  resolution: "ACCEPT_CLAIM" | "HOLD_ORIGINAL"
) {
  return parseResponse<PersistedSubmissionPayload>(
    await fetch(`/api/submissions/${id}/resolve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ resolution })
    })
  );
}

export async function markRemoteNotificationRead(id: string) {
  return parseResponse<{ ok: true }>(
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ unread: false })
    })
  );
}

export async function dismissRemoteNotification(id: string) {
  return parseResponse<{ ok: true }>(
    await fetch(`/api/notifications/${id}`, {
      method: "DELETE"
    })
  );
}

export async function markAllRemoteNotificationsRead() {
  return parseResponse<{ ok: true }>(
    await fetch("/api/notifications/read-all", {
      method: "POST"
    })
  );
}

export async function fetchRemoteTreasury() {
  return parseResponse<{
    summary: {
      totalDeposited: number;
      availableBalance: number;
      yieldEarned: number;
    };
    allocation: TreasuryAllocationRow[];
    chart: TreasuryChartPoint[];
    transactions: TreasuryTransaction[];
  }>(await fetch("/api/treasury", { cache: "no-store" }));
}
