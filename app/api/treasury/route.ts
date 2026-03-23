import { NextResponse } from "next/server";

import {
  buildTreasurySnapshot,
  buildTreasuryYieldChart,
  normalizeStoredSubmission,
  normalizeStoredTreasuryTransaction
} from "@/lib/demo-persistence";
import { requireApiRole } from "@/lib/server/authorization";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 503 });
  }

  const auth = await requireApiRole({
    route: "/api/treasury",
    roles: ["owner"],
    requireAllowedOwnerEmail: true
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

  const [transactionsResult, submissionsResult] = await Promise.all([
    supabase
      .from("demo_treasury_transactions")
      .select("id, type, amount, description, tx_hash, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("demo_submissions")
      .select("admin_id, researcher_submission_id, payload")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  const firstError = transactionsResult.error || submissionsResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const transactionRows = transactionsResult.data ?? [];
  const transactions = transactionRows.map((row) => normalizeStoredTreasuryTransaction(row));
  const reserved = (submissionsResult.data ?? [])
    .map((row) => normalizeStoredSubmission(row))
    .filter(Boolean)
    .reduce((sum, entry) => {
      if (!entry) {
        return sum;
      }

      return ["DISPUTE WINDOW", "DISPUTE OPEN"].includes(entry.decision.status)
        ? sum + Math.round((entry.adminSubmission.tierReward * entry.decision.payoutPct) / 100)
        : sum;
    }, 0);
  const snapshot = buildTreasurySnapshot(transactions, reserved);

  return NextResponse.json({
    summary: snapshot.summary,
    allocation: snapshot.allocation,
    chart: buildTreasuryYieldChart(transactionRows),
    transactions
  });
}
