import styles from "./landing-page.module.css";
import { cn } from "@/lib/utils";

export function CSSTreasuryChart({
  data,
  compact = false,
  className
}: {
  data: number[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-end gap-2",
        compact ? "h-20 grid-cols-7" : "h-44 grid-cols-[repeat(auto-fit,minmax(12px,1fr))]",
        className
      )}
    >
      {data.map((value, index) => (
        <div
          key={`${value}-${index}`}
          data-value={`${value}%`}
          className={cn(
            styles.chartBar,
            "relative bg-primary-gradient transition-transform duration-100 ease-linear hover:-translate-y-1"
          )}
          style={{ height: `${value}%` }}
        />
      ))}
    </div>
  );
}
