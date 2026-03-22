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
    <section className="p-6 md:p-8 xl:p-10">
      <div className="space-y-10">
        <div className="space-y-4">
          <p className="bf-label text-primary">PROJECT OWNER ENTRY</p>
          <h1 className="bf-display text-[2.7rem] leading-none tracking-tightHeading sm:text-[3.9rem]">
            OVERVIEW
          </h1>
          <p className="text-sm leading-8 text-muted">
            ETHEREUM L2 BRIDGE AUDIT | LAST UPDATED 2 MIN AGO
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="space-y-4 bg-surface-high p-6">
              <p className="bf-label">{stat.label}</p>
              <p className={`bf-data text-[2.15rem] ${stat.tone}`}>{stat.value}</p>
              <p className="text-sm leading-7 text-muted">{stat.detail}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-6 bg-surface-high p-7 md:p-8">
            <div className="space-y-3">
              <p className="bf-label text-primary">BOUNTY HEALTH</p>
              <h2 className="bf-display text-[1.5rem] leading-none tracking-tightHeading">
                TREASURY REMAINING
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.62fr_0.38fr] lg:items-center">
              <div className="relative mx-auto h-[180px] w-[180px]">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    className="stroke-outline-variant/20"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="url(#health-ring)"
                    strokeWidth="10"
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
                  <p className="bf-data text-[2rem] text-primary">{healthBreakdown.remainingPct}%</p>
                  <p className="bf-label">OF POOL REMAINING</p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {formatCurrency(healthBreakdown.currentBalance, 0)} /{" "}
                    {formatCurrency(healthBreakdown.totalBalance, 0)}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
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
                    <div className="flex items-center justify-between gap-4">
                      <span className="bf-label text-foreground">{row.label}</span>
                      <span className="bf-data text-[0.9rem] text-foreground">
                        {formatCurrency(row.amount, 0)}
                      </span>
                    </div>
                    <div className="h-[8px] bg-background">
                      <div className={`h-full ${row.tone}`} style={{ width: `${row.width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm leading-7 text-primary">
              IDLE FUNDS EARNING YIELD ON AAVE V3 | APY: {healthBreakdown.apy}
            </p>
          </section>

          <section className="space-y-6 bg-surface-high p-7 md:p-8">
            <div className="space-y-3">
              <p className="bf-label text-primary">RECENT ACTIVITY</p>
              <h2 className="bf-display text-[1.5rem] leading-none tracking-tightHeading">
                FEED
              </h2>
            </div>

            <div className="space-y-4">
              {recentActivity.map((item) => (
                <article key={item.id} className="flex gap-4 bg-background p-5">
                  <span className={`mt-1 h-3 w-3 shrink-0 ${activityTone(item.type)}`} />
                  <div className="space-y-2">
                    <p className="text-sm leading-7 text-foreground">{item.label}</p>
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
