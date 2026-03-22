import styles from "./landing-page.module.css";
import type { TickerItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function emphasisClass(emphasis?: TickerItem["emphasis"]) {
  if (emphasis === "primary") {
    return "text-primary-container";
  }

  if (emphasis === "danger") {
    return "text-danger";
  }

  return "text-muted";
}

export function ActivityTicker({
  items,
  speed = 28
}: {
  items: TickerItem[];
  speed?: number;
}) {
  const loopedItems = [...items, ...items];

  return (
    <div className="bg-background py-3">
      <div className="bf-shell">
        <div
          className={cn(styles.marquee, "bf-panel py-3")}
          style={{ ["--duration" as string]: `${speed}s` }}
        >
          <div className={styles.marqueeTrack}>
            {loopedItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center gap-3 px-3">
                <span className="bf-data text-[0.64rem] uppercase text-foreground">{item.label}</span>
                {item.amount ? (
                  <span className={cn("bf-data text-[0.64rem] uppercase", emphasisClass(item.emphasis))}>
                    {item.amount}
                  </span>
                ) : null}
                <span className="bf-data text-[0.64rem] uppercase text-outline-variant">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
