import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";
import { BountiesExplorerShell } from "@/components/bounties/bounties-explorer-shell";
import { bounties } from "@/lib/bounty-data";

export default function BountiesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="bf-shell pt-24 pb-18">
        <div className="grid gap-7 xl:grid-cols-[1fr_0.62fr] xl:items-end">
          <div className="space-y-4">
            <p className="bf-label text-primary">PUBLIC PROGRAM INDEX</p>
            <h1 className="bf-display text-[2rem] leading-none tracking-tightHeading sm:text-[3rem]">
              ACTIVE
              <span className="block bg-primary-gradient bg-clip-text text-transparent">
                BOUNTIES
              </span>
            </h1>
          </div>
          <p className="max-w-lg justify-self-end text-[0.8rem] leading-7 text-muted sm:text-[0.86rem]">
            Browse verified programs by reward, severity, and platform category. Every listed
            treasury is intended to represent a live escrow pool routed through the on-chain
            bounty flow described in the PRD.
          </p>
        </div>

        <div className="mt-10">
          <BountiesExplorerShell items={bounties} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
