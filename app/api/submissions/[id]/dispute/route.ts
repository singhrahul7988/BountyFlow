import { NextResponse } from "next/server";

import { getRoleFromProfile } from "@/lib/auth";
import { getAdminSubmissionById } from "@/lib/admin-submissions-data";
import { formatUtcTimestamp, normalizeStoredSubmission } from "@/lib/demo-persistence";
import { getResearcherSubmissionById } from "@/lib/dashboard-data";
import { createOwnerNotification } from "@/lib/onchain/service";
import type { SubmissionDisputeNote } from "@/lib/demo-types";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getProfileByUserId } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    reason?: string;
    desiredPct?: number;
    justification?: string;
  } | null;

  if (!body?.reason?.trim() || !body?.desiredPct) {
    return NextResponse.json(
      { error: "Dispute reason and desired payout percentage are required." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { profile } = await getProfileByUserId(supabase, user.id);

  if (getRoleFromProfile(profile) !== "researcher") {
    return NextResponse.json({ error: "Researcher access required." }, { status: 403 });
  }

  let { data: row, error } = await supabase
    .from("demo_submissions")
    .select("admin_id, researcher_submission_id, payload, researcher_user_id, owner_id")
    .eq("researcher_submission_id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!row) {
    const seededResearcher = getResearcherSubmissionById(params.id);
    const seededAdmin = getAdminSubmissionById(`BF-${params.id.replace(/^sub-/, "")}`);

    if (!seededResearcher || !seededAdmin) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    row = {
      admin_id: seededAdmin.id,
      researcher_submission_id: seededResearcher.id,
      researcher_user_id: user.id,
      owner_id: null,
      payload: {
        adminSubmission: seededAdmin,
        researcherSubmission: seededResearcher,
        decision: {
          status: seededAdmin.status,
          payoutPct: seededAdmin.recommendedPct,
          disputeNote: seededAdmin.disputeNote
        }
      }
    };
  }

  if (row.researcher_user_id !== user.id) {
    return NextResponse.json({ error: "This submission belongs to another researcher." }, { status: 403 });
  }

  const normalized = normalizeStoredSubmission(row);

  if (!normalized) {
    return NextResponse.json({ error: "Stored submission payload is invalid." }, { status: 500 });
  }

  if (normalized.decision.status !== "DISPUTE WINDOW") {
    return NextResponse.json(
      { error: "Disputes can only be opened while the submission is in the dispute window." },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const disputeNote: SubmissionDisputeNote = {
    reason: body.reason.trim(),
    desiredPct: body.desiredPct,
    approvedPct: normalized.decision.payoutPct,
    justification: body.justification?.trim() || undefined,
    openedAt: formatUtcTimestamp(now.toISOString()),
    expiresAt: formatUtcTimestamp(expiresAt.toISOString())
  };

  const nextDecision = {
    ...normalized.decision,
    status: "DISPUTE OPEN" as const,
    disputeNote
  };
  const nextAdminSubmission = {
    ...normalized.adminSubmission,
    status: "DISPUTE OPEN" as const,
    disputeNote
  };
  const nextResearcherSubmission = {
    ...normalized.researcherSubmission,
    status: "DISPUTE OPEN" as const,
    responseEta: "OWNER RESOLUTION PENDING",
    dispute: disputeNote
  };

  const nextPayload = {
    adminSubmission: nextAdminSubmission,
    researcherSubmission: nextResearcherSubmission,
    decision: nextDecision
  };

  const { data: updatedRow, error: updateError } = await supabase
    .from("demo_submissions")
    .update({
      status: "DISPUTE OPEN",
      payload: nextPayload
    })
    .eq("researcher_submission_id", params.id)
    .select("admin_id, researcher_submission_id, payload")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (row.owner_id) {
    try {
      await createOwnerNotification(supabase, {
        ownerId: row.owner_id,
        type: "DISPUTE",
        title: `Researcher opened dispute on ${normalized.adminSubmission.id}`,
        description: `Requested ${disputeNote.desiredPct}% with justification for a higher payout decision.`,
        actionLabel: "REVIEW DISPUTE ->",
        actionHref: `/admin/submissions/${normalized.adminSubmission.id}`
      });
    } catch {
      // The dispute itself should still persist if notification tables are not ready.
    }
  }

  const item = normalizeStoredSubmission(updatedRow);

  if (!item) {
    return NextResponse.json({ error: "Failed to normalize disputed submission." }, { status: 500 });
  }

  return NextResponse.json(item);
}
