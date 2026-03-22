import Link from "next/link";

import { footerGroups } from "@/lib/mock-data";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="bg-background py-12">
      <div className="bf-shell">
        <div className="mx-auto w-full max-w-[1420px] space-y-8">
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.72fr_0.72fr_0.8fr]">
          <div className="bf-panel space-y-4 p-6">
            <Logo />
            <p className="max-w-md text-[0.8rem] leading-7 text-muted">
              The decentralized standard for security bounties. Scalable, autonomous, and
              immutable escrow built on Tether WDK.
            </p>
            <div className="flex gap-2">
              {["X", "G", "C"].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={item}
                  className="flex h-8 w-8 items-center justify-center border border-outline/20 text-[0.72rem] text-muted transition-colors duration-100 ease-linear hover:border-outline/50 hover:text-primary"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title} className="bf-panel space-y-4 p-6">
              <p className="bf-label">{group.title}</p>
              <div className="flex flex-col gap-4">
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="font-mono text-[0.68rem] uppercase tracking-label text-foreground transition-colors duration-100 ease-linear hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="bf-panel space-y-4 p-6">
            <p className="bf-label">POWERED BY</p>
            <div className="inline-flex items-center gap-3 bg-surface-high px-4 py-3.5">
              <span className="h-1.5 w-1.5 animate-pulse-dot bg-primary" />
              <div>
                <p className="bf-label text-primary">TETHER WDK</p>
                <p className="bf-label">USDT ESCROW ENGINE</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-outline-variant/15 pt-4.5 text-[0.64rem] uppercase tracking-label text-muted md:flex-row md:items-center md:justify-between">
          <span>Copyright 2026 BountyFlow. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <span>Powered by Tether WDK</span>
            <Link href="/docs">Privacy</Link>
            <Link href="/docs">Terms</Link>
            <Link href="/docs">Legal</Link>
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}
