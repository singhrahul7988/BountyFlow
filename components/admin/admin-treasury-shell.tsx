"use client";

import { useEffect, useState } from "react";

import {
  treasuryAllocation,
  treasurySummary,
  treasuryTransactions,
  treasuryYieldChart
} from "@/lib/admin-treasury-data";
import { fetchRemoteTreasury } from "@/lib/demo-api";
import { AdminTreasuryView } from "./admin-treasury-view";

export function AdminTreasuryShell() {
  const [payload, setPayload] = useState({
    summary: treasurySummary,
    allocation: treasuryAllocation,
    chart: treasuryYieldChart,
    transactions: treasuryTransactions
  });

  useEffect(() => {
    let cancelled = false;

    fetchRemoteTreasury()
      .then((result) => {
        if (!cancelled) {
          setPayload(result);
        }
      })
      .catch(() => {
        // Seeded treasury data remains the fallback if remote ledger tables are not ready yet.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminTreasuryView
      summary={payload.summary}
      allocation={payload.allocation}
      chart={payload.chart}
      transactions={payload.transactions}
    />
  );
}
