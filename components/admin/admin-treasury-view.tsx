"use client";

import { useEffect, useMemo, useState } from "react";

import {
  treasuryAllocation,
  treasurySummary,
  treasuryTransactions,
  treasuryYieldChart,
  type TreasuryAllocationRow,
  type TreasuryChartPoint,
  type TreasuryTransaction,
  type TreasuryTransactionType
} from "@/lib/admin-treasury-data";
import { formatCurrency } from "@/lib/utils";
import { StatusChip } from "../home/status-chip";

const transactionFilters = ["ALL", "DEPOSITS", "PAYOUTS", "YIELD"] as const;

export function AdminTreasuryView({
  summary = treasurySummary,
  allocation = treasuryAllocation,
  chart = treasuryYieldChart,
  transactions = treasuryTransactions
}: {
  summary?: typeof treasurySummary;
  allocation?: TreasuryAllocationRow[];
  chart?: TreasuryChartPoint[];
  transactions?: TreasuryTransaction[];
}) {
  const [yieldEarned, setYieldEarned] = useState(summary.yieldEarned);
  const [availableBalance, setAvailableBalance] = useState(summary.availableBalance);
  const [activeFilter, setActiveFilter] = useState<(typeof transactionFilters)[number]>("ALL");
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  useEffect(() => {
    setYieldEarned(summary.yieldEarned);
    setAvailableBalance(summary.availableBalance);
  }, [summary.availableBalance, summary.yieldEarned]);

  useEffect(() => {
    setIsChartVisible(true);

    const interval = window.setInterval(() => {
      setYieldEarned((current) => Number((current + 0.02).toFixed(2)));
      setAvailableBalance((current) => Number((current + 0.02).toFixed(2)));
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  const chartMax = Math.max(...chart.map((point) => point.amount), 1);
  const yAxisLabels = [Math.round(chartMax), Math.round(chartMax * 0.66), Math.round(chartMax * 0.33)];

  const visibleTransactions = useMemo(() => {
    if (activeFilter === "ALL") {
      return transactions;
    }

    const mappedType: Record<(typeof transactionFilters)[number], TreasuryTransactionType | null> = {
      ALL: null,
      DEPOSITS: "DEPOSIT",
      PAYOUTS: "PAYOUT",
      YIELD: "YIELD"
    };

    return transactions.filter(
      (transaction) => transaction.type === mappedType[activeFilter]
    );
  }, [activeFilter, transactions]);

  return (
    <section className="p-6 md:p-8 xl:p-10">
      <div className="space-y-9">
        <div className="space-y-4">
          <p className="bf-label text-primary">OWNER TREASURY</p>
          <h1 className="bf-display text-[2.9rem] leading-none tracking-tightHeading sm:text-[4.1rem]">
            TREASURY
          </h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <article className="space-y-4 bg-surface-high p-6">
            <p className="bf-label">TOTAL DEPOSITED</p>
            <p className="bf-data text-[2.15rem] text-primary">
              {formatCurrency(summary.totalDeposited, 0)}
            </p>
            <p className="text-sm leading-7 text-muted">
              Total USDT capital committed to the active bounty wallet.
            </p>
          </article>

          <article className="space-y-4 bg-surface-high p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="bf-label">AVAILABLE BALANCE</p>
              <StatusChip status="EARNING YIELD" />
            </div>
            <p className="bf-data text-[2.15rem] text-primary">
              {formatCurrency(availableBalance, 2)}
            </p>
            <p className="text-sm leading-7 text-muted">
              Idle funds are routed through Aave V3 until they are reserved or withdrawn.
            </p>
          </article>

          <article className="space-y-4 bg-surface-high p-6">
            <p className="bf-label">YIELD EARNED</p>
            <p className="bf-data text-[2.15rem] text-primary">
              {formatCurrency(yieldEarned, 2)}
            </p>
            <p className="text-sm leading-7 text-muted">
              Live counter increments every 3 seconds from the simulated yield route.
            </p>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr] xl:items-start">
          <section className="space-y-5 bg-surface-high p-6 md:p-7">
            <div className="space-y-3">
              <p className="bf-label text-primary">DAILY YIELD EARNED (LAST 14 DAYS)</p>
              <h2 className="bf-display text-[1.65rem] leading-none tracking-tightHeading">
                YIELD CHART
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-end">
              <div className="flex h-44 flex-col justify-between pb-6">
                {yAxisLabels.map((label) => (
                  <span key={label} className="bf-data text-[0.72rem] text-muted">
                    {formatCurrency(label, 0)}
                  </span>
                ))}
              </div>

              <div className="space-y-3">
                <div className="relative h-44">
                  <div className="absolute inset-0 grid grid-cols-14 items-end gap-2">
                    {chart.map((point, index) => {
                      const isToday = index === chart.length - 1;
                      const height = `${(point.amount / chartMax) * 100}%`;
                      const isHovered = hoveredDay === point.day;

                      return (
                        <div
                          key={point.day}
                          className="relative flex h-full items-end"
                          onMouseEnter={() => setHoveredDay(point.day)}
                          onMouseLeave={() => setHoveredDay(null)}
                        >
                          {isHovered ? (
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-background px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-label text-primary">
                              {formatCurrency(point.amount, 2)}
                            </div>
                          ) : null}
                          <div
                            className={`w-full ${isToday ? "bg-primary-gradient" : "bg-primary/40"} transition-[height] duration-700 ease-out`}
                            style={{ height: isChartVisible ? height : "0%" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-14 gap-2">
                  {chart.map((point) => (
                    <span key={point.day} className="text-center font-data text-[0.56rem] text-muted">
                      {point.day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5 bg-surface-high p-6 md:p-7">
            <div className="space-y-3">
              <p className="bf-label text-primary">FUND ALLOCATION</p>
              <h2 className="bf-display text-[1.65rem] leading-none tracking-tightHeading">
                POOL BREAKDOWN
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-background text-left">
                    {["CATEGORY", "AMOUNT", "% OF POOL", "STATUS"].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 font-mono text-[0.72rem] uppercase tracking-label text-muted"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allocation.map((row) => (
                    <tr key={row.category}>
                      <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.86rem] text-foreground">
                        {row.category}
                      </td>
                      <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.9rem] text-primary">
                        {formatCurrency(row.amount, 0)}
                      </td>
                      <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.86rem] text-muted">
                        {row.percentOfPool}%
                      </td>
                      <td className="border-b border-outline-variant/15 px-5 py-5">
                        <StatusChip status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="space-y-6 bg-surface-high p-6 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="space-y-3">
              <p className="bf-label text-primary">TRANSACTION HISTORY</p>
              <h2 className="bf-display text-[1.65rem] leading-none tracking-tightHeading">
                TREASURY LEDGER
              </h2>
            </div>

            <div className="flex flex-wrap gap-4 border-b border-outline-variant/15 pb-3 lg:ml-8">
              {transactionFilters.map((filterValue) => (
                <button
                  key={filterValue}
                  type="button"
                  onClick={() => setActiveFilter(filterValue)}
                  className={`border-b-2 pb-3 font-mono text-[0.78rem] uppercase tracking-label transition-colors duration-100 ease-linear ${
                    activeFilter === filterValue
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {filterValue}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] border-collapse">
              <thead>
                <tr className="bg-background text-left">
                  {["DATE", "TYPE", "AMOUNT", "DESCRIPTION", "TX HASH"].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 font-mono text-[0.72rem] uppercase tracking-label text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map((transaction) => (
                  <tr key={transaction.id} className="transition-colors duration-100 ease-linear hover:bg-background">
                    <td className="border-b border-outline-variant/15 px-5 py-5 font-data text-[0.82rem] text-muted">
                      {transaction.date}
                    </td>
                    <td className="border-b border-outline-variant/15 px-5 py-5">
                      <span
                        className={`font-data text-[0.82rem] ${
                          transaction.type === "YIELD" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td
                      className={`border-b border-outline-variant/15 px-5 py-5 font-data text-[0.9rem] ${
                        transaction.type === "PAYOUT" ? "text-danger" : "text-primary"
                      }`}
                    >
                      {transaction.amount < 0
                        ? `-${formatCurrency(Math.abs(transaction.amount), 2)}`
                        : formatCurrency(transaction.amount, 2)}
                    </td>
                    <td className="border-b border-outline-variant/15 px-5 py-5 text-sm leading-7 text-muted">
                      {transaction.description}
                    </td>
                    <td className="border-b border-outline-variant/15 px-5 py-5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 font-data text-[0.82rem] text-primary transition-colors duration-100 ease-linear hover:text-primary-fixed"
                      >
                        <span>{transaction.txHash}</span>
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        >
                          <path d="M6 4H12V10" />
                          <path d="M12 4L5 11" />
                          <path d="M4 6V12H10" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="bf-button-secondary justify-center">
              TOP UP TREASURY
            </button>
            <button type="button" className="bf-button-tertiary">
              WITHDRAW AVAILABLE FUNDS
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
