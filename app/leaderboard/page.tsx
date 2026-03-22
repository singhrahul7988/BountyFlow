import Link from "next/link";

import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";
import { getAuthHref } from "@/lib/auth";
import { leaderboardRows } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const totalPaidOut = leaderboardRows.reduce((sum, row) => sum + row.paidOut, 0);
const totalFindings = leaderboardRows.reduce((sum, row) => sum + row.findings, 0);
const averageRepScore =
  leaderboardRows.reduce((sum, row) => sum + row.repScore, 0) / leaderboardRows.length;
const criticalResearchers = leaderboardRows.filter(
  (row) => row.topSeverity === "CRITICAL"
).length;
const topResearcher = leaderboardRows[0];
const topFindingsRow = leaderboardRows.reduce((best, row) =>
  row.findings > best.findings ? row : best
);

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="bf-shell pt-20 pb-16">
        <div className="mx-auto w-full max-w-[1420px]">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.5fr] xl:items-end">
          <div className="space-y-3">
            <p className="bf-label text-primary">RESEARCHER PERFORMANCE INDEX</p>
            <h1 className="bf-display text-[1.8rem] leading-none tracking-tightHeading sm:text-[2.55rem]">
              GLOBAL
              <span className="block bg-primary-gradient bg-clip-text text-transparent">
                LEADERBOARD
              </span>
            </h1>
          </div>

          <div className="max-w-[24rem] space-y-3 xl:justify-self-end">
            <p className="text-[0.74rem] leading-6 text-muted sm:text-[0.8rem]">
              Track top-performing researchers by verified findings, payout history, severity
              depth, and reputation score across active BountyFlow programs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/bounties" className="bf-button-primary px-4 py-2 text-[0.62rem]">
                BROWSE PROGRAMS
              </Link>
              <Link href="/auth" className="bf-button-secondary px-4 py-2 text-[0.62rem]">
                OPEN DASHBOARD
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "TOTAL PAID OUT", value: `${formatCurrency(totalPaidOut, 0)} USDT` },
            { label: "VERIFIED FINDINGS", value: `${totalFindings}` },
            { label: "AVERAGE REP SCORE", value: averageRepScore.toFixed(1) },
            { label: "CRITICAL SPECIALISTS", value: `${criticalResearchers}` }
          ].map((card) => (
            <article key={card.label} className="bf-panel space-y-2.5 p-4.5">
              <p className="bf-label">{card.label}</p>
              <p className="bf-data text-[1.2rem] text-primary sm:text-[1.4rem]">{card.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
          <article className="bf-panel space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <p className="bf-label text-primary">TOP RESEARCHER</p>
                <h2 className="bf-display text-[1.4rem] leading-none tracking-tightHeading sm:text-[1.75rem]">
                  {topResearcher.researcher}
                </h2>
              </div>
              <span className="bf-data text-[1.05rem] text-primary">{topResearcher.rank}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <p className="bf-label">PAID OUT</p>
                <p className="bf-data text-[0.92rem] text-foreground">
                  {formatCurrency(topResearcher.paidOut, 0)} USDT
                </p>
              </div>
              <div className="space-y-1">
                <p className="bf-label">FINDINGS</p>
                <p className="bf-data text-[0.92rem] text-foreground">{topResearcher.findings}</p>
              </div>
              <div className="space-y-1">
                <p className="bf-label">REP SCORE</p>
                <p className="bf-data text-[0.92rem] text-foreground">{topResearcher.repScore}</p>
              </div>
            </div>

            <p className="max-w-2xl text-[0.76rem] leading-6 text-muted sm:text-[0.82rem]">
              Rankings prioritize verified payout history, volume of accepted findings, and
              consistency at higher severities. Researchers with repeat critical or high-severity
              wins naturally separate from the field.
            </p>
          </article>

          <article className="bf-panel space-y-4 p-5">
            <p className="bf-label text-primary">INSIGHTS</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/15 pb-2.5">
                <span className="bf-label">MOST FINDINGS</span>
                <span className="bf-data text-[0.88rem] text-foreground">
                  {topFindingsRow.researcher} · {topFindingsRow.findings}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/15 pb-2.5">
                <span className="bf-label">CRITICAL RATE</span>
                <span className="bf-data text-[0.88rem] text-foreground">
                  {Math.round((criticalResearchers / leaderboardRows.length) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="bf-label">PAYOUT PER FINDING</span>
                <span className="bf-data text-[0.88rem] text-foreground">
                  {formatCurrency(Math.round(totalPaidOut / totalFindings), 0)} USDT
                </span>
              </div>
            </div>
          </article>
        </div>

        <div className="bf-panel mt-8 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-surface-high text-left">
                {[
                  "RANK",
                  "RESEARCHER",
                  "FINDINGS",
                  "PAID OUT",
                  "REP SCORE",
                  "TOP SEVERITY"
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`py-3.5 pr-4.5 font-mono text-[0.62rem] uppercase tracking-label text-muted ${
                      heading === "RANK" ? "pl-3" : "pl-4.5"
                    } ${
                      heading === "FINDINGS" || heading === "REP SCORE" ? "text-center" : ""
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboardRows.map((row, index) => (
                <tr
                  key={row.rank}
                  className={`transition-colors duration-100 ease-linear hover:bg-surface-high ${
                    index === 0 ? "bg-amber/5" : ""
                  }`}
                >
                  <td className="border-b border-outline-variant/15 py-4.5 pl-3 pr-4.5 font-data text-[0.8rem] text-primary">
                    {row.rank}
                  </td>
                  <td className="border-b border-outline-variant/15 px-4.5 py-4.5 font-data text-[0.8rem]">
                    {row.researcher}
                  </td>
                  <td className="border-b border-outline-variant/15 px-4.5 py-4.5 text-center font-data text-[0.8rem] text-muted">
                    {row.findings}
                  </td>
                  <td className="border-b border-outline-variant/15 px-4.5 py-4.5 font-data text-[0.8rem] text-primary">
                    {formatCurrency(row.paidOut, 0)} USDT
                  </td>
                  <td className="border-b border-outline-variant/15 px-4.5 py-4.5 text-center font-data text-[0.8rem] text-foreground">
                    {row.repScore}
                  </td>
                  <td className="border-b border-outline-variant/15 px-4.5 py-4.5">
                    <span
                      className={`inline-flex h-[2rem] w-[5.8rem] items-center justify-center border px-2 font-mono text-[0.58rem] uppercase tracking-label ${
                        row.topSeverity === "CRITICAL"
                          ? "border-danger/25 bg-danger/15 text-danger"
                          : "border-amber/25 bg-amber/15 text-amber"
                      }`}
                    >
                      {row.topSeverity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
