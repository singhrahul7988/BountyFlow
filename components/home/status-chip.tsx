import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "border border-primary-container/25 bg-primary-container/15 text-primary",
  LIVE: "border border-primary-container/25 bg-primary-container/15 text-primary",
  "AI SCORING": "border border-indigo/25 bg-indigo/20 text-indigo",
  "UNDER REVIEW": "border border-amber/25 bg-amber/15 text-amber",
  "DISPUTE WINDOW": "border border-amber/25 bg-amber/15 text-amber",
  "DISPUTE OPEN": "border border-amber/25 bg-amber/15 text-amber",
  DRAFT: "border border-outline/20 bg-surface-highest text-muted",
  SUBMITTED: "border border-indigo/25 bg-indigo/20 text-indigo",
  PAID: "border border-primary-container/25 bg-primary-container/15 text-primary",
  CONFIRMED: "border border-primary-container/25 bg-primary-container/15 text-primary",
  REJECTED: "border border-outline/20 bg-surface-highest text-muted",
  "EARNING YIELD": "border border-primary-container/25 bg-primary-container/15 text-primary",
  "HIGH REWARD": "border border-amber/25 bg-amber/15 text-amber",
  NEW: "border border-indigo/25 bg-indigo/20 text-indigo",
  "ESCROW VERIFIED": "border border-primary-container/25 bg-primary-container/15 text-primary",
  "AI SCORED": "border border-indigo/25 bg-indigo/20 text-indigo",
  "FIX IN PROGRESS": "border border-amber/25 bg-amber/15 text-amber",
  CRITICAL: "border border-danger/25 bg-danger/15 text-danger",
  "CRITICAL FINDING": "border border-danger/25 bg-danger/15 text-danger",
  HIGH: "border border-amber/25 bg-amber/15 text-amber",
  MEDIUM: "border border-indigo/25 bg-indigo/20 text-indigo",
  LOW: "border border-outline/20 bg-surface-highest text-foreground",
  VERIFIED: "border border-primary-container/25 bg-primary-container/15 text-primary",
  YIELD: "border border-primary-container/25 bg-primary-container/15 text-primary",
  "AAVE V3": "border border-primary-container/25 bg-primary-container/15 text-primary",
  "TIER 2 RESEARCHER - UNLOCKED": "border border-indigo/25 bg-indigo/20 text-indigo"
};

export function StatusChip({
  status,
  pulsing = false,
  className
}: {
  status: string;
  pulsing?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-label={status}
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.06em]",
        STATUS_STYLES[status] ?? "bg-surface-highest text-muted",
        className
      )}
    >
      {pulsing ? <span className="h-2 w-2 animate-pulse-dot bg-current" /> : null}
      {status}
    </span>
  );
}
