import Link from "next/link";

import type { BountyCardData } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const accentMap: Record<BountyCardData["severity"], string> = {
  featured: "bg-danger",
  high: "bg-amber",
  open: "bg-indigo"
};

export function BountyCard({
  slug,
  href,
  title,
  platform,
  rewardPool,
  tiers,
  submissionCount,
  status,
  severity,
  description,
  ctaLabel,
  compact = false
}: BountyCardData & { compact?: boolean }) {
  return (
    <article
      className="bf-panel group relative flex h-full flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[4px] hover:border-outline/30 hover:bg-surface-high"
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${accentMap[severity]}`} aria-hidden="true" />
      <div className={`flex h-full flex-col ${compact ? "gap-4 p-4 pl-5" : "gap-5 p-5 pl-6"}`}>
        <div className={`flex items-start justify-between ${compact ? "min-h-[5.6rem] gap-2.5" : "min-h-[7rem] gap-3"}`}>
          <div className="min-w-0 flex-1">
            <p className={`bf-label ${compact ? "text-[0.58rem]" : "text-[0.64rem]"}`}>{platform}</p>
            <h3
              className={`bf-display max-w-[9ch] leading-none tracking-tightHeading text-foreground ${
                compact
                  ? "mt-3 min-h-[2.9rem] text-[1.15rem] sm:text-[1.3rem]"
                  : "mt-4 min-h-[3.6rem] text-[1.55rem] sm:text-[1.75rem]"
              }`}
            >
              {title}
            </h3>
          </div>
          <span className={`bf-label text-right text-muted ${compact ? "w-[3.1rem] text-[0.56rem]" : "w-[3.7rem] text-[0.64rem]"}`}>
            {submissionCount} FILED
          </span>
        </div>

        <p
          className={`max-w-sm text-muted ${compact ? "min-h-[4.3rem] text-[0.72rem] leading-6" : "min-h-[5.15rem] text-[0.84rem] leading-7"}`}
          style={{
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            display: "-webkit-box",
            overflow: "hidden"
          }}
        >
          {description}
        </p>

        <div className={`mt-auto grid text-sm ${compact ? "gap-2.5" : "gap-3"}`}>
          <span className="bf-label">POOL</span>
          <p
            className={`bf-data leading-none text-primary ${
              compact
                ? "min-h-[1.9rem] text-[1.45rem] sm:text-[1.6rem]"
                : "min-h-[2.4rem] text-[1.95rem] sm:text-[2.15rem]"
            }`}
          >
            {formatCurrency(rewardPool, 0)} USDT
          </p>
          <div className={`flex flex-wrap content-start gap-1.5 ${compact ? "min-h-[3.3rem]" : "min-h-[4.5rem]"}`}>
            {tiers.map((tier) => (
              <span
                key={tier}
                className={`bg-surface-high font-mono uppercase tracking-label text-muted ${
                  compact ? "px-1 py-[0.22rem] text-[0.38rem]" : "px-1.5 py-[0.34rem] text-[0.54rem]"
                }`}
              >
                {tier}
              </span>
            ))}
          </div>
          <div
            className={`flex items-end pt-1 ${
              compact ? "min-h-[2.1rem] justify-end gap-2.5" : "min-h-[3rem] justify-between gap-3"
            }`}
          >
            {!compact ? (
              <span className="bf-label max-w-[7rem] text-[0.64rem]">{status}</span>
            ) : null}
            <Link
              href={href ?? (slug ? `/bounty/${slug}` : "/bounties")}
              className={`bf-button-secondary text-foreground ${
                compact ? "min-w-[5.9rem] px-3 py-1.5 text-[0.58rem]" : "min-w-[7rem] px-4 py-2 text-[0.68rem]"
              }`}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
