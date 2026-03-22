import Link from "next/link";

import { getAuthHref } from "@/lib/auth";
import {
  liveBounties,
  pipelineSteps,
  tickerItems,
  treasuryBars
} from "@/lib/mock-data";
import { ActivityTicker } from "./activity-ticker";
import { AnalyzerDemo } from "./analyzer-demo";
import { LiveListingsCarousel } from "./live-listings-carousel";
import styles from "./landing-page.module.css";
import { Navbar } from "./navbar";
import { RevealSection } from "./reveal-section";
import { SiteFooter } from "./site-footer";
import { TreasuryCounter } from "./treasury-counter";

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />

      <section className={`relative w-full overflow-hidden pt-16 ${styles.heroTexture}`}>
        <div
          className={`${styles.bloom} absolute left-[-10%] top-20 h-[600px] w-[600px]`}
          aria-hidden="true"
        />
        <div className="bf-shell flex min-h-[calc(100svh-4rem)] flex-col justify-center py-4 lg:min-h-[calc(100svh-4.25rem)] lg:py-3">
          <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.72fr)] xl:gap-5">
            <div className="w-full" data-reveal="left" style={{ ["--reveal-order" as string]: 0 }}>
              <div className="inline-flex items-center gap-2.5 bg-surface-high px-3 py-2.5">
                <span className="h-1.5 w-1.5 animate-pulse-dot bg-primary" />
                <span className="bf-label text-[0.6rem] text-primary">POWERED BY TETHER WDK</span>
              </div>

              <h1 className="bf-display mt-5 max-w-[12.5ch] text-[clamp(2.1rem,5vw,4.15rem)] font-semibold leading-[0.9] tracking-[0.03em]">
                EVERY
                <span className="block">SECURITY</span>
                <span className="block">RESEARCHER</span>
                <span className="block">DESERVES</span>
                <span className="block bg-primary-gradient bg-clip-text text-transparent">
                  ON-CHAIN
                </span>
                <span className="block">REWARDS.</span>
              </h1>

              <p className="mt-4 max-w-[34rem] text-[0.84rem] leading-6 text-muted sm:text-[0.9rem]">
                AI evaluates every finding. USDT releases automatically. Immutable payouts for
                the sovereign auditor.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/bounties" className="bf-button-primary px-5 py-2.5 text-[0.67rem]">
                  BROWSE BOUNTIES
                  <span aria-hidden="true">-&gt;</span>
                </Link>
                <Link
                  href={getAuthHref("owner", "/admin")}
                  className="bf-button-secondary px-5 py-2.5 text-[0.67rem]"
                >
                  POST A BOUNTY
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="bf-data text-[0.64rem] uppercase text-muted">MAINNET_V2</span>
                <span className="bf-data text-[0.64rem] uppercase text-outline-variant">|</span>
                <span className="bf-data text-[0.64rem] uppercase text-muted">TETHER WDK</span>
                <span className="bf-data text-[0.64rem] uppercase text-outline-variant">|</span>
                <span className="bf-data text-[0.64rem] uppercase text-primary">99.00%</span>
              </div>
            </div>

            <div
              className="w-full lg:justify-self-center lg:self-center xl:max-w-[26rem] xl:-translate-x-10"
              data-reveal="right"
              style={{ ["--reveal-order" as string]: 1 }}
            >
              <TreasuryCounter
                initialBalance={124877}
                apyRate={1.68}
                bars={treasuryBars}
                yieldImpact="$18.44"
                averageLast="$2.12M"
              />
            </div>
          </div>
        </div>
      </section>

      <ActivityTicker items={tickerItems} />

      <RevealSection className="bf-section py-18 md:py-20">
        <section className="bf-shell">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end">
            <div data-reveal="left" style={{ ["--reveal-order" as string]: 0 }}>
              <h2 className="bf-display text-[1.95rem] leading-none tracking-tightHeading sm:text-[3rem]">
                AUTOMATED
                <span className="block bg-primary-gradient bg-clip-text text-transparent">
                  AUDIT PIPELINE
                </span>
              </h2>
            </div>
            <p
              className="max-w-[24rem] text-[0.84rem] leading-7 text-muted sm:text-[0.9rem] lg:justify-self-start lg:pb-2"
              data-reveal="right"
              style={{ ["--reveal-order" as string]: 1 }}
            >
              From vulnerability detection to instant settlement without intermediary friction.
            </p>
          </div>

          <div className="bf-panel mt-9 p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {pipelineSteps.map((step) => (
                <article
                  key={step.id}
                  className="bg-surface-high p-5 transition-colors duration-300 ease-out hover:-translate-y-[3px] hover:bg-surface-highest xl:min-h-[14rem]"
                  data-reveal="zoom"
                  style={{ ["--reveal-order" as string]: Number(step.id) }}
                >
                  <p className="bf-display text-[2.1rem] leading-none tracking-tightHeading text-muted/40">
                    {step.id}
                  </p>
                  <h3 className="bf-display mt-5 text-[1.15rem] leading-none tracking-tightHeading">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-[16rem] text-[0.86rem] leading-7 text-muted">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection className="bf-section pt-0 pb-18 md:pb-20">
        <section className="bf-shell">
          <div className="bf-panel p-4 sm:p-6">
            <LiveListingsCarousel items={liveBounties} />
          </div>
        </section>
      </RevealSection>

      <RevealSection className="bf-section py-18 md:py-20">
        <section className="bf-shell">
          <AnalyzerDemo />
        </section>
      </RevealSection>

      <RevealSection className="bf-section py-18 md:py-20">
        <section className="bf-shell">
          <div className="grid gap-5 lg:grid-cols-2">
            <article
              className="bf-panel flex min-h-[18rem] flex-col p-7 md:p-8"
              data-reveal="left"
              style={{ ["--reveal-order" as string]: 0 }}
            >
              <h2 className="bf-display text-[1.95rem] leading-none tracking-tightHeading text-foreground sm:text-[2.25rem]">
                FOR
                <span className="block">RESEARCHERS</span>
              </h2>
              <p className="mt-5 max-w-md text-[0.88rem] leading-7 text-muted">
                Monetize your critical skill set. Get paid instantly in USDT for valid findings
                with zero trust required.
              </p>
              <Link href="/bounties" className="bf-button-tertiary mt-auto pt-8 text-[0.66rem]">
                START HUNTING
                <span aria-hidden="true">-&gt;</span>
              </Link>
            </article>

            <article
              className="bf-panel flex min-h-[18rem] flex-col p-7 md:p-8"
              data-reveal="right"
              style={{ ["--reveal-order" as string]: 1 }}
            >
              <h2 className="bf-display text-[1.95rem] leading-none tracking-tightHeading text-foreground sm:text-[2.25rem]">
                FOR PROJECT
                <span className="block">OWNERS</span>
              </h2>
              <p className="mt-5 max-w-md text-[0.88rem] leading-7 text-muted">
                Launch a bug bounty in minutes. Secure your protocol with true world-class
                researcher flow and automated settlement.
              </p>
              <Link
                href={getAuthHref("owner", "/admin")}
                className="bf-button-tertiary mt-auto pt-8 text-[0.66rem]"
              >
                LAUNCH PROGRAM
                <span aria-hidden="true">-&gt;</span>
              </Link>
            </article>
          </div>
        </section>
      </RevealSection>

      <SiteFooter />
    </main>
  );
}
