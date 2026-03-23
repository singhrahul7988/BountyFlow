import { NextResponse } from "next/server";

import { isAllowedOwnerEmail } from "@/lib/auth";
import {
  normalizeStoredBounty,
  normalizeStoredNotification,
  normalizeStoredSubmission
} from "@/lib/demo-persistence";
import type { AdminNotification } from "@/lib/admin-notifications-data";
import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import type { SubmissionDecision } from "@/lib/demo-types";
import { requireApiRole } from "@/lib/server/authorization";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      bounties: [] satisfies BountyDetail[],
      adminSubmissions: [] satisfies AdminSubmission[],
      researcherSubmissions: [] satisfies ResearcherSubmission[],
      decisions: {} satisfies Record<string, SubmissionDecision>,
      notifications: [] satisfies AdminNotification[]
    });
  }

  const auth = await requireApiRole({
    route: "/api/demo-state",
    roles: ["owner", "researcher"],
    requireAllowedOwnerEmail: true
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user, role } = auth;

  const [
    bountiesResult,
    ownerSubmissionResult,
    researcherSubmissionResult,
    notificationsResult
  ] = await Promise.all([
    role === "owner"
      ? supabase
          .from("demo_bounties")
          .select("slug, payload")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role === "owner" && isAllowedOwnerEmail(user.email || "")
      ? supabase
          .from("demo_submissions")
          .select("admin_id, researcher_submission_id, payload")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role === "researcher"
      ? supabase
          .from("demo_submissions")
          .select("admin_id, researcher_submission_id, payload")
          .eq("researcher_user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    role === "owner" && isAllowedOwnerEmail(user.email || "")
      ? supabase
          .from("demo_notifications")
          .select("id, type, title, description, unread, action_label, action_href, created_at")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null })
  ]);

  const firstError =
    bountiesResult.error ||
    ownerSubmissionResult.error ||
    researcherSubmissionResult.error ||
    notificationsResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const bounties = (bountiesResult.data ?? [])
    .map((row) => normalizeStoredBounty(row))
    .filter((item): item is BountyDetail => Boolean(item));

  const normalizedOwnerSubmissions = (ownerSubmissionResult.data ?? [])
    .map((row) => normalizeStoredSubmission(row))
    .filter(Boolean);
  const normalizedResearcherSubmissions = (researcherSubmissionResult.data ?? [])
    .map((row) => normalizeStoredSubmission(row))
    .filter(Boolean);
  const allNormalized = [...normalizedOwnerSubmissions, ...normalizedResearcherSubmissions];

  const adminSubmissions: AdminSubmission[] = [];
  const researcherSubmissions: ResearcherSubmission[] = [];
  const decisions: Record<string, SubmissionDecision> = {};
  const notifications =
    role === "owner"
      ? (notificationsResult.data ?? []).map((row) => normalizeStoredNotification(row))
      : [];

  allNormalized.forEach((entry) => {
    if (!entry) {
      return;
    }

    if (role === "owner") {
      adminSubmissions.push(entry.adminSubmission);
    }

    if (role === "researcher") {
      researcherSubmissions.push(entry.researcherSubmission);
    }

    decisions[entry.adminSubmission.id] = entry.decision;
  });

  return NextResponse.json({
    bounties,
    adminSubmissions,
    researcherSubmissions,
    decisions,
    notifications
  });
}
