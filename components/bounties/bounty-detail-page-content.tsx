import Link from "next/link";

import type { BountyDetail } from "@/lib/bounty-data";
import { formatCurrency } from "@/lib/utils";
import { Navbar } from "../home/navbar";
import { SiteFooter } from "../home/site-footer";
import { StatusChip } from "../home/status-chip";
import { BountyDetailTabs } from "./bounty-detail-tabs";

export function BountyDetailPageContent({ bounty }: { bounty: BountyDetail }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="bg-surface-low pt-32 pb-12">
        <div className="bf-shell">
          <div className="mx-auto w-full max-w-[1420px]">
            <div className="grid gap-10 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusChip status={bounty.status} />
                  <span className="bf-label text-foreground">{bounty.platform}</span>
                </div>
                <h1 className="bf-display text-[2.7rem] leading-none tracking-tightHeading sm:text-[4rem]">
                  {bounty.title}
                </h1>
                <Link
                  href={bounty.platformUrl}
                  className="bf-button-tertiary"
                  target="_blank"
                  rel="noreferrer"
                >
                  {bounty.platformUrl}
                </Link>
              </div>

              <div className="space-y-2">
                <p className="bf-label">TOTAL POOL</p>
                <p className="bf-data text-[2.8rem] text-primary">
                  {formatCurrency(bounty.rewardPool, 0)} USDT
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bf-shell py-16">
        <div className="mx-auto w-full max-w-[1420px]">
          <div className="grid gap-10 xl:grid-cols-[1fr_0.42fr]">
            <BountyDetailTabs bounty={bounty} />

            <aside className="space-y-6 xl:sticky xl:top-28">
              <div className="space-y-5 bg-surface-low p-6">
                <h2 className="bf-display text-[1.4rem] leading-none tracking-tightHeading">
                  REWARD TIERS
                </h2>
                <div className="space-y-4">
                  {[
                    ["CRITICAL", bounty.rewardTiers.critical],
                    ["HIGH", bounty.rewardTiers.high],
                    ["MEDIUM", bounty.rewardTiers.medium],
                    ["LOW", bounty.rewardTiers.low],
                    ["INFO", bounty.rewardTiers.informational]
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <span className="bf-label text-foreground">{label}</span>
                      <span className="bf-data text-[0.95rem] text-primary">
                        {formatCurrency(Number(value), 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5 bg-surface-low p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="bf-display text-[1.4rem] leading-none tracking-tightHeading">
                    ESCROW STATUS
                  </h2>
                  <StatusChip status="LIVE" />
                </div>
                <div className="space-y-2">
                  <p className="bf-data text-[2.2rem] text-primary">
                    {formatCurrency(bounty.escrowBalance, 0)} USDT
                  </p>
                  <p className="bf-label">VERIFIED ON-CHAIN</p>
                </div>
                <div className="space-y-3 text-sm text-muted">
                  <p>WALLET: {bounty.escrowAddress}</p>
                  <p>{bounty.submissionCount} SUBMISSIONS TOTAL</p>
                  <p>{bounty.resolvedCount} RESOLVED | {bounty.activeCount} ACTIVE</p>
                </div>
              </div>

              <Link
                href={`/bounty/${bounty.slug}/submit`}
                className="bf-button-primary w-full justify-center"
              >
                SUBMIT FINDING
              </Link>

              <button type="button" className="bf-button-tertiary">
                SHARE BOUNTY
              </button>
            </aside>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
