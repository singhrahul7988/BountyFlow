"use client";

import { cn } from "@/lib/utils";

export type SeverityValue = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const severityStyles: Record<SeverityValue, string> = {
  CRITICAL: "data-[selected=true]:bg-danger data-[selected=true]:text-foreground",
  HIGH: "data-[selected=true]:bg-amber data-[selected=true]:text-background",
  MEDIUM: "data-[selected=true]:bg-indigo data-[selected=true]:text-foreground",
  LOW: "data-[selected=true]:bg-primary-container data-[selected=true]:text-on-primary"
};

export function SeveritySegment({
  value,
  onChange
}: {
  value: SeverityValue | "";
  onChange: (value: SeverityValue) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as SeverityValue[]).map((option) => (
        <button
          key={option}
          type="button"
          data-selected={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "border border-transparent bg-surface-low px-4 py-4 font-mono text-[0.78rem] uppercase tracking-label text-muted transition-colors duration-100 ease-linear hover:bg-surface-high hover:text-foreground",
            severityStyles[option]
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
