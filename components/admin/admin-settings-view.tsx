"use client";

import { useDemoDataStore } from "@/lib/stores/demo-data-store";

export function AdminSettingsView() {
  const settings = useDemoDataStore((state) => state.ownerSettings);
  const updateOwnerSettings = useDemoDataStore((state) => state.updateOwnerSettings);

  return (
    <section className="p-5 md:p-6 xl:p-7">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="bf-label text-primary">PROGRAM SETTINGS</p>
          <h1 className="bf-display text-[2.3rem] leading-none tracking-tightHeading sm:text-[3.3rem]">
            SETTINGS
          </h1>
          <p className="max-w-3xl text-[0.84rem] leading-7 text-muted">
            Configure review thresholds, response expectations, treasury automation, and owner-side
            alerts for the active program.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <section className="space-y-6">
            <div className="space-y-5 bg-surface-high p-5 md:p-6">
              <div className="space-y-2">
                <p className="bf-label text-primary">PROGRAM CONTROL</p>
                <h2 className="bf-display text-[1.35rem] leading-none tracking-tightHeading">
                  OPERATING MODE
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(["ACTIVE", "PAUSED"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateOwnerSettings({ programStatus: mode })}
                    className={`p-4 text-left transition-colors duration-100 ease-linear ${
                      settings.programStatus === mode
                        ? "bg-background text-primary"
                        : "bg-background/60 text-muted hover:bg-background"
                    }`}
                  >
                    <p className="bf-label">{mode}</p>
                    <p className="mt-3 text-[0.8rem] leading-6 text-muted">
                      {mode === "ACTIVE"
                        ? "Program accepts new reports and runs the normal owner review flow."
                        : "Program stays visible but pauses new operational processing for owners."}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 bg-surface-high p-5 md:p-6">
              <div className="space-y-2">
                <p className="bf-label text-primary">AI THRESHOLDS</p>
                <h2 className="bf-display text-[1.35rem] leading-none tracking-tightHeading">
                  TRIAGE POLICY
                </h2>
              </div>

              <label className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">MIN SCORE TO NOTIFY OWNER</span>
                  <span className="bf-data text-[1rem] text-primary">
                    {settings.notifyThreshold.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={settings.notifyThreshold}
                  onChange={(event) =>
                    updateOwnerSettings({ notifyThreshold: Number(event.target.value) })
                  }
                  className="w-full accent-[#6effc0]"
                />
              </label>

              <label className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">AUTO-REJECT BELOW</span>
                  <span className="bf-data text-[1rem] text-amber">
                    {settings.autoRejectBelow.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.5}
                  value={settings.autoRejectBelow}
                  onChange={(event) =>
                    updateOwnerSettings({ autoRejectBelow: Number(event.target.value) })
                  }
                  className="w-full accent-[#F59E0B]"
                />
              </label>

              <label className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">TARGET RESPONSE SLA</span>
                  <span className="bf-data text-[1rem] text-primary">
                    {settings.responseSlaHours}H
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={72}
                  step={4}
                  value={settings.responseSlaHours}
                  onChange={(event) =>
                    updateOwnerSettings({ responseSlaHours: Number(event.target.value) })
                  }
                  className="w-full accent-[#6effc0]"
                />
              </label>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-5 bg-surface-high p-5 md:p-6">
              <div className="space-y-2">
                <p className="bf-label text-primary">DISPUTE + TREASURY</p>
                <h2 className="bf-display text-[1.35rem] leading-none tracking-tightHeading">
                  AUTOMATION RULES
                </h2>
              </div>

              <label className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">DISPUTE WINDOW</span>
                  <span className="bf-data text-[1rem] text-amber">
                    {settings.disputeWindowHours} HOURS
                  </span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={72}
                  step={12}
                  value={settings.disputeWindowHours}
                  onChange={(event) =>
                    updateOwnerSettings({ disputeWindowHours: Number(event.target.value) })
                  }
                  className="w-full accent-[#F59E0B]"
                />
              </label>

              <div className="grid gap-3">
                {[
                  {
                    key: "autoReleasePayouts",
                    label: "AUTO-RELEASE APPROVED PAYOUTS",
                    value: settings.autoReleasePayouts
                  },
                  {
                    key: "treasuryYieldEnabled",
                    label: "ROUTE IDLE FUNDS TO YIELD",
                    value: settings.treasuryYieldEnabled
                  },
                  {
                    key: "duplicateCheckEnabled",
                    label: "DUPLICATE CHECK BEFORE OWNER NOTIFY",
                    value: settings.duplicateCheckEnabled
                  },
                  {
                    key: "ownerEmailAlerts",
                    label: "EMAIL ALERTS FOR OWNER EVENTS",
                    value: settings.ownerEmailAlerts
                  }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      updateOwnerSettings({
                        [item.key]: !item.value
                      } as Partial<typeof settings>)
                    }
                    className="flex items-center justify-between gap-4 bg-background p-3.5 text-left"
                  >
                    <span className="bf-label text-foreground">{item.label}</span>
                    <span className={`bf-label ${item.value ? "text-primary" : "text-muted"}`}>
                      {item.value ? "ENABLED" : "DISABLED"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 bg-surface-high p-5 md:p-6">
              <div className="space-y-2">
                <p className="bf-label text-primary">OWNER CONTACT</p>
                <h2 className="bf-display text-[1.35rem] leading-none tracking-tightHeading">
                  SECURITY CHANNEL
                </h2>
              </div>

              <label className="space-y-3">
                <span className="bf-label text-foreground">CONTACT EMAIL</span>
                <input
                  value={settings.securityContact}
                  onChange={(event) =>
                    updateOwnerSettings({ securityContact: event.target.value })
                  }
                  className="bf-terminal-input"
                  placeholder="security@project.com"
                />
              </label>

              <div className="border border-primary/20 bg-background p-4">
                <p className="bf-label text-primary">LIVE CONFIG SNAPSHOT</p>
                <div className="mt-4 space-y-2 text-[0.8rem] leading-6 text-muted">
                  <p>PROGRAM STATUS: {settings.programStatus}</p>
                  <p>AI NOTIFY THRESHOLD: {settings.notifyThreshold.toFixed(1)}</p>
                  <p>AUTO-REJECT BELOW: {settings.autoRejectBelow.toFixed(1)}</p>
                  <p>DISPUTE WINDOW: {settings.disputeWindowHours} HOURS</p>
                  <p>SECURITY CONTACT: {settings.securityContact}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
