"use client";

import { useEffect, useState } from "react";

import { formatCurrency } from "@/lib/utils";
import { CSSTreasuryChart } from "./css-treasury-chart";
import { StatusChip } from "./status-chip";

export function TreasuryCounter({
  initialBalance,
  apyRate,
  intervalMs = 3000,
  bars,
  yieldImpact,
  averageLast
}: {
  initialBalance: number;
  apyRate: number;
  intervalMs?: number;
  bars: number[];
  yieldImpact: string;
  averageLast: string;
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [yieldValue, setYieldValue] = useState(yieldImpact);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBalance((currentBalance) => {
        const tickAmount = (currentBalance * apyRate * (intervalMs / 1000)) / (365 * 24 * 3600);
        return Number((currentBalance + tickAmount).toFixed(2));
      });

      setYieldValue((currentYield) => {
        const numericYield = Number(currentYield.replace(/[^0-9.-]/g, ""));
        return `$${(numericYield + 0.02).toFixed(2)}`;
      });
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [apyRate, intervalMs]);

  return (
    <div className="bf-panel relative overflow-hidden border-l-[3px] border-primary-container px-5 py-5 md:px-5 md:py-5">
      <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_64px]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="bf-label font-data text-[0.6rem] text-muted">TREASURY LIVE</span>
            <span className="h-1.5 w-1.5 animate-pulse-dot bg-primary" />
          </div>
          <div className="space-y-2.5">
            <p className="bf-data text-[1.85rem] text-foreground sm:text-[2.15rem]">{formatCurrency(balance, 0)}</p>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="h-1.5 w-1.5 bg-primary" />
              <p className="bf-label text-[0.5rem] text-primary">STABLECOIN ESCROW VERIFIED</p>
            </div>
          </div>
        </div>

        <div className="flex h-[64px] w-[64px] items-center justify-center bg-surface-highest/60">
          <svg
            viewBox="0 0 72 72"
            className="h-8 w-8 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <rect x="10" y="10" width="52" height="52" />
            <rect x="24" y="20" width="24" height="32" rx="2" />
            <circle cx="36" cy="36" r="3.5" />
          </svg>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-[4px] bg-outline-variant/35">
          <div className="h-full w-[72%] bg-primary-gradient" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="bf-label text-[0.58rem]">72% CAPACITY</span>
          <span className="bf-label text-[0.58rem]">$500,000 LIMIT</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <StatusChip status="LIVE" className="px-2.25 py-1 text-[0.54rem]" />
            <span className="bf-data text-[0.78rem] text-foreground">{yieldValue}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bf-label text-[0.54rem]">AVG VOLUME</span>
            <span className="bf-data text-[0.78rem] text-foreground">{averageLast}</span>
          </div>
        </div>
        <div className="pt-1">
          <CSSTreasuryChart data={bars} compact className="opacity-60" />
        </div>
      </div>
    </div>
  );
}
