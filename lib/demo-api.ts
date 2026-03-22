"use client";

import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import type { PersistedSubmissionPayload, SubmissionDecision } from "@/lib/demo-types";

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
