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
  const yAxisTicks = useMemo(() => {
    const tickCount = 4;
    return Array.from({ length: tickCount + 1 }, (_, index) => {
      const ratio = (tickCount - index) / tickCount;
      return Number((chartMax * ratio).toFixed(0));
    });
  }, [chartMax]);

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
    <section className="p-4 md:p-5 xl:p-6">
      <div className="space-y-5">
        <div className="space-y-2.5">
          <p className="bf-label text-primary">OWNER TREASURY</p>
          <h1 className="bf-display text-[1.65rem] leading-none tracking-tightHeading sm:text-[2.2rem]">
            TREASURY
          </h1>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <article className="space-y-2.5 bg-surface-high p-3.5">
            <p className="bf-label">TOTAL DEPOSITED</p>
            <p className="bf-data text-[1.28rem] text-primary">
              {formatCurrency(summary.totalDeposited, 0)}
            </p>
            <p className="text-[0.74rem] leading-5 text-muted">
              Total USDT capital committed to the active bounty wallet.
            </p>
          </article>

          <article className="space-y-2.5 bg-surface-high p-3.5">
            <div className="flex items-center justify-between gap-4">
              <p className="bf-label">AVAILABLE BALANCE</p>
              <StatusChip status="EARNING YIELD" />
            </div>
            <p className="bf-data text-[1.28rem] text-primary">
              {formatCurrency(availableBalance, 2)}
            </p>
            <p className="text-[0.74rem] leading-5 text-muted">
              Idle funds are routed through Aave V3 until they are reserved or withdrawn.
            </p>
          </article>

          <article className="space-y-2.5 bg-surface-high p-3.5">
            <p className="bf-label">YIELD EARNED</p>
            <p className="bf-data text-[1.28rem] text-primary">
              {formatCurrency(yieldEarned, 2)}
            </p>
            <p className="text-[0.74rem] leading-5 text-muted">
              Live counter increments every 3 seconds from the simulated yield route.
            </p>
          </article>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr] xl:items-start">
          <section className="space-y-4 bg-surface-high p-4 md:p-5">
            <div className="space-y-2.5">
              <p className="bf-label text-primary">DAILY YIELD EARNED (LAST 14 DAYS)</p>
              <h2 className="bf-display text-[1.08rem] leading-none tracking-tightHeading">
                YIELD CHART
              </h2>
            </div>

            <div className="grid grid-cols-[3rem_1fr] gap-3">
              <div className="relative h-[15rem]">
                {yAxisTicks.map((tickValue, index) => (
                  <div
                    key={`${tickValue}-${index}`}
                    className="absolute left-0 right-0 flex -translate-y-1/2 items-center justify-end"
                    style={{ top: `${(index / (yAxisTicks.length - 1)) * 100}%` }}
                  >
                    <span className="font-data text-[0.56rem] text-muted">
                      ${tickValue}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative h-[15rem] border-l border-b border-outline/18 pl-3 pb-6">
                {yAxisTicks.map((tickValue, index) => (
                  <div
                    key={`grid-${tickValue}-${index}`}
                    className="absolute left-3 right-0 border-t border-outline/10"
                    style={{ top: `${(index / (yAxisTicks.length - 1)) * 100}%` }}
                  />
                ))}

                <div className="relative flex h-full items-end gap-2">
                  {chart.map((point, index) => {
                    const isToday = index === chart.length - 1;
                    const barHeight = `${(point.amount / chartMax) * 100}%`;
                    const isHovered = hoveredDay === point.day;

                    return (
                      <div
                        key={point.day}
                        className="relative flex min-w-0 flex-1 flex-col items-center justify-end"
                        onMouseEnter={() => setHoveredDay(point.day)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <div
                          className={`absolute -top-7 whitespace-nowrap font-data text-[0.56rem] transition-colors duration-150 ${
                            isHovered ? "text-primary" : "text-muted"
                          }`}
                        >
                          {isHovered ? formatCurrency(point.amount, 2) : ""}
                        </div>
                        <div
                          className={`w-full max-w-[1.35rem] transition-[height] duration-700 ease-out ${
                            isToday ? "bg-primary-gradient" : "bg-primary/55"
                          } ${isHovered ? "opacity-100" : "opacity-90"}`}
                          style={{ height: isChartVisible ? barHeight : "0%" }}
                        />
                        <span className="absolute -bottom-5 font-data text-[0.52rem] text-muted">
                          {point.day.replace("MAR ", "")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 bg-surface-high p-4 md:p-5">
            <div className="space-y-2.5">
              <p className="bf-label text-primary">FUND ALLOCATION</p>
              <h2 className="bf-display text-[1.08rem] leading-none tracking-tightHeading">
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
                        className="px-3 py-2.5 font-mono text-[0.6rem] uppercase tracking-label text-muted"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allocation.map((row) => (
                    <tr key={row.category}>
                      <td className="border-b border-outline-variant/15 px-3 py-3 font-data text-[0.74rem] text-foreground">
                        {row.category}
                      </td>
                      <td className="border-b border-outline-variant/15 px-3 py-3 font-data text-[0.76rem] text-primary">
                        {formatCurrency(row.amount, 0)}
                      </td>
                      <td className="border-b border-outline-variant/15 px-3 py-3 font-data text-[0.74rem] text-muted">
                        {row.percentOfPool}%
                      </td>
                      <td className="border-b border-outline-variant/15 px-3 py-3">
                        <StatusChip status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="space-y-4 bg-surface-high p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="space-y-2.5">
              <p className="bf-label text-primary">TRANSACTION HISTORY</p>
              <h2 className="bf-display text-[1.08rem] leading-none tracking-tightHeading">
                TREASURY LEDGER
              </h2>
            </div>

            <div className="flex flex-wrap gap-3 border-b border-outline-variant/15 pb-2.5">
              {transactionFilters.map((filterValue) => (
                <button
                  key={filterValue}
                  type="button"
                  onClick={() => setActiveFilter(filterValue)}
                  className={`border-b-2 pb-2.5 font-mono text-[0.66rem] uppercase tracking-label transition-colors duration-100 ease-linear ${
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
            <table className="min-w-[860px] border-collapse">
              <thead>
                <tr className="bg-background text-left">
                  {["DATE", "TYPE", "AMOUNT", "DESCRIPTION", "TX HASH"].map((heading) => (
                    <th
                      key={heading}
                        className="px-3 py-2.5 font-mono text-[0.6rem] uppercase tracking-label text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map((transaction) => (
                  <tr key={transaction.id} className="transition-colors duration-100 ease-linear hover:bg-background">
                    <td className="border-b border-outline-variant/15 px-3 py-3 font-data text-[0.7rem] text-muted">
                      {transaction.date}
                    </td>
                    <td className="border-b border-outline-variant/15 px-3 py-3">
                      <span
                        className={`font-data text-[0.7rem] ${
                          transaction.type === "YIELD" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td
                      className={`border-b border-outline-variant/15 px-3 py-3 font-data text-[0.76rem] ${
                        transaction.type === "PAYOUT" ? "text-danger" : "text-primary"
                      }`}
                    >
                      {transaction.amount < 0
                        ? `-${formatCurrency(Math.abs(transaction.amount), 2)}`
                        : formatCurrency(transaction.amount, 2)}
                    </td>
                    <td className="border-b border-outline-variant/15 px-3 py-3 text-[0.72rem] leading-5 text-muted">
                      {transaction.description}
                    </td>
                    <td className="border-b border-outline-variant/15 px-3 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 font-data text-[0.7rem] text-primary transition-colors duration-100 ease-linear hover:text-primary-fixed"
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
