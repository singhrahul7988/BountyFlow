"use client";

import { useState } from "react";

import type { BountyDetail } from "@/lib/bounty-data";

const tabs = ["OVERVIEW", "SCOPE", "SUBMISSIONS", "RULES"] as const;

export function BountyDetailTabs({ bounty }: { bounty: BountyDetail }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("OVERVIEW");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-6 border-b border-outline-variant/15 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 pb-3 font-mono text-[0.78rem] uppercase tracking-label transition-colors duration-100 ease-linear ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "OVERVIEW" ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="bf-display text-[1.6rem] leading-none tracking-tightHeading">PROGRAM OVERVIEW</h2>
            <p className="max-w-4xl text-[1rem] leading-8 text-muted">{bounty.description}</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4 bg-surface-low p-6">
              <h3 className="bf-display text-[1.25rem] leading-none tracking-tightHeading">SEVERITY DEFINITIONS</h3>
              <div className="space-y-4">
                {bounty.severityDefinitions.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <p className="bf-label text-primary">{item.label}</p>
                    <p className="text-sm leading-7 text-muted">{item.definition}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 bg-surface-low p-6">
              <h3 className="bf-display text-[1.25rem] leading-none tracking-tightHeading">ACCEPTED EVIDENCE</h3>
              <div className="flex flex-wrap gap-2">
                {bounty.acceptedEvidenceTypes.map((item) => (
                  <span key={item} className="bg-surface-high px-3 py-2 font-mono text-[0.72rem] uppercase tracking-label text-muted">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "SCOPE" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 bg-surface-low p-6">
            <h3 className="bf-display text-[1.25rem] leading-none tracking-tightHeading">IN SCOPE</h3>
            <ul className="space-y-3 text-sm leading-7 text-muted">
              {bounty.scopeIn.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 bg-surface-low p-6">
            <h3 className="bf-display text-[1.25rem] leading-none tracking-tightHeading">OUT OF SCOPE</h3>
            <ul className="space-y-3 text-sm leading-7 text-muted">
              {bounty.scopeOut.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {activeTab === "SUBMISSIONS" ? (
        <div className="space-y-4">
          <h3 className="bf-display text-[1.25rem] leading-none tracking-tightHeading">RECENT ACTIVITY</h3>
          <div className="space-y-3">
            {bounty.recentActivity.map((item) => (
              <div key={item.id} className="grid gap-3 bg-surface-low p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                <p className="text-sm leading-7 text-foreground">{item.label}</p>
                <span className="bf-data text-[0.8rem] text-muted">{item.timestamp}</span>
                <span className="bf-label text-primary">{item.outcome}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "RULES" ? (
        <div className="space-y-4 bg-surface-low p-6">
          <h3 className="bf-display text-[1.25rem] leading-none tracking-tightHeading">PROGRAM RULES</h3>
          <ul className="space-y-3 text-sm leading-7 text-muted">
            {bounty.rules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
