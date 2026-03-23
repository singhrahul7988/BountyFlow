import { adminHealthBreakdown, adminOverviewStats, adminRecentActivity } from "@/lib/admin-data";
import { formatCurrency } from "@/lib/utils";

function activityTone(type: string) {
  if (type === "CRITICAL") {
    return "bg-danger";
  }

  if (type === "PAYOUT" || type === "REVIEW") {
    return "bg-amber";
  }

  return "bg-primary";
}

export function AdminOverview({
  stats = adminOverviewStats,
  healthBreakdown = adminHealthBreakdown,
  recentActivity = adminRecentActivity
}: {
  stats?: typeof adminOverviewStats;
  healthBreakdown?: typeof adminHealthBreakdown;
  recentActivity?: typeof adminRecentActivity;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (healthBreakdown.remainingPct / 100) * circumference;

  return (
    <section className="p-4 md:p-5 xl:p-6">
      <div className="space-y-5">
        <div className="space-y-2.5">
          <p className="bf-label text-primary">PROJECT OWNER ENTRY</p>
          <h1 className="bf-display text-[1.65rem] leading-none tracking-tightHeading sm:text-[2.2rem]">
            OVERVIEW
          </h1>
          <p className="text-[0.76rem] leading-6 text-muted">
            ETHEREUM L2 BRIDGE AUDIT | LAST UPDATED 2 MIN AGO
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="space-y-2.5 bg-surface-high p-3.5">
              <p className="bf-label">{stat.label}</p>
              <p className={`bf-data text-[1.28rem] ${stat.tone}`}>{stat.value}</p>
              <p className="text-[0.74rem] leading-5 text-muted">{stat.detail}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.96fr_1.04fr] xl:items-start">
          <section className="space-y-3.5 bg-surface-high p-3.5 md:p-4">
            <div className="space-y-2.5">
              <p className="bf-label text-primary">BOUNTY HEALTH</p>
              <h2 className="bf-display text-[1.1rem] leading-none tracking-tightHeading">
                TREASURY REMAINING
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.5fr_0.5fr] lg:items-center">
              <div className="space-y-3">
                <div className="relative mx-auto h-[148px] w-[148px]">
                  <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    className="stroke-outline-variant/20"
                    strokeWidth="9"
                    fill="none"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="url(#health-ring)"
                    strokeWidth="9"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="square"
                  />
                  <defs>
                    <linearGradient id="health-ring" x1="0%" x2="100%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#6effc0" />
                      <stop offset="100%" stopColor="#00e5a0" />
                    </linearGradient>
                  </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="bf-data text-[1.45rem] text-primary">{healthBreakdown.remainingPct}%</p>
                  </div>
                </div>
                <div className="space-y-1 text-center">
                  <p className="bf-data text-[0.9rem] text-primary">
                    {formatCurrency(healthBreakdown.currentBalance, 0)}
                  </p>
                  <p className="text-[0.7rem] leading-5 text-muted">
                    OF {formatCurrency(healthBreakdown.totalBalance, 0)} TOTAL POOL
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "PAID OUT",
                    amount: healthBreakdown.paidOutAmount,
                    width: healthBreakdown.paidOutPct,
                    tone: "bg-amber"
                  },
                  {
                    label: "RESERVED",
                    amount: healthBreakdown.reservedAmount,
                    width: healthBreakdown.reservedPct,
                    tone: "bg-indigo"
                  },
                  {
                    label: "AVAILABLE",
                    amount: healthBreakdown.availableAmount,
                    width: healthBreakdown.availablePct,
                    tone: "bg-primary-gradient"
                  }
                ].map((row) => (
                  <div key={row.label} className="space-y-2">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                      <span className="bf-label text-foreground">{row.label}</span>
                      <span className="justify-self-end bf-label text-muted">{row.width}%</span>
                      <span className="bf-data text-[0.74rem] text-foreground">
                        {formatCurrency(row.amount, 0)}
                      </span>
                    </div>
                    <div className="h-[8px] overflow-hidden bg-background">
                      <div className={`h-full ${row.tone}`} style={{ width: `${row.width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[0.74rem] leading-5 text-primary">
              IDLE FUNDS EARNING YIELD ON AAVE V3 | APY: {healthBreakdown.apy}
            </p>
          </section>

          <section className="space-y-3.5 self-start bg-surface-high p-3.5 md:p-4">
            <div className="space-y-2.5">
              <p className="bf-label text-primary">RECENT ACTIVITY</p>
              <h2 className="bf-display text-[1.05rem] leading-none tracking-tightHeading">
                FEED
              </h2>
            </div>

            <div className="max-h-[13.2rem] space-y-3 overflow-y-auto pr-1">
              {recentActivity.map((item) => (
                <article key={item.id} className="flex gap-3 bg-background p-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 ${activityTone(item.type)}`} />
                  <div className="space-y-2">
                    <p className="text-[0.74rem] leading-5 text-foreground">{item.label}</p>
                    <p className="bf-label">{item.timestamp}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
