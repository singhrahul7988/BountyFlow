"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { adminBountyContext } from "@/lib/admin-data";
import { adminSubmissions as seededAdminSubmissions } from "@/lib/admin-submissions-data";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { useAppStore } from "@/lib/stores/app-store";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { useAuthenticatedDemoStateSync } from "@/lib/use-demo-sync";
import { cn, truncateAddress } from "@/lib/utils";
import { Logo } from "../home/logo";
import { StatusChip } from "../home/status-chip";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 2H7V7H2z" />
        <path d="M9 2H14V7H9z" />
        <path d="M2 9H7V14H2z" />
        <path d="M9 9H14V14H9z" />
      </svg>
    )
  },
  {
    label: "Submissions",
    href: "/admin/submissions",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 3H13V13H3z" />
        <path d="M5 6H11" />
        <path d="M5 8.5H11" />
        <path d="M5 11H9" />
      </svg>
    )
  },
  {
    label: "Treasury",
    href: "/admin/treasury",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M2 5H14V12H2z" />
        <path d="M11 8.5H14" />
        <path d="M3.5 3.5H11.5" />
      </svg>
    )
  },
  {
    label: "Create Bounty",
    href: "/admin/create",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M8 3V13" />
        <path d="M3 8H13" />
      </svg>
    )
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M8 2.5A3 3 0 0 1 11 5.5V8L12.5 10.5H3.5L5 8V5.5A3 3 0 0 1 8 2.5z" />
        <path d="M6.5 12.5A1.5 1.5 0 0 0 9.5 12.5" />
      </svg>
    )
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M8 3.2L9.2 2l1.6 1 .1 1.7 1.5.9 1.5-.5.8 1.7-1.1 1.2.1 1.7 1.1 1.2-.8 1.7-1.5-.5-1.5.9-.1 1.7-1.6 1L8 12.8 6.8 14l-1.6-1-.1-1.7-1.5-.9-1.5.5-.8-1.7 1.1-1.2-.1-1.7L.9 6.1l.8-1.7 1.5.5 1.5-.9.1-1.7 1.6-1L8 3.2z" />
        <circle cx="8" cy="8" r="2.1" />
      </svg>
    )
  }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
  const { currentUser, hasHydrated, signOut } = useAppStore();
  useAuthenticatedDemoStateSync(currentUser?.role === "owner");
  const demoAdminSubmissions = useDemoDataStore((state) => state.demoAdminSubmissions);
  const submissionDecisions = useDemoDataStore((state) => state.submissionDecisions);
  const notifications = useDemoDataStore((state) => state.notifications);

  const adminSubmissions = useMemo(() => {
    const seen = new Set<string>();
    return [...demoAdminSubmissions, ...seededAdminSubmissions].filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    });
  }, [demoAdminSubmissions]);

  const submissionsBadge = adminSubmissions.filter((submission) =>
    ["AI SCORED", "UNDER REVIEW", "DISPUTE OPEN"].includes(
      submissionDecisions[submission.id]?.status ?? submission.status
    )
  ).length;

  const notificationsBadge = notifications.filter((item) => item.unread).length;

  const computedNavItems = navItems.map((item) => ({
    ...item,
    badge:
      item.href === "/admin/submissions"
        ? submissionsBadge
        : item.href === "/admin/notifications"
          ? notificationsBadge
          : undefined
  }));

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="bg-surface-low lg:fixed lg:inset-y-0 lg:left-0 lg:w-[240px]">
        <div className="flex h-full flex-col gap-8 p-6">
          <Link href="/admin">
            <Logo />
          </Link>

          <div className="space-y-4 bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="bf-label">ACTIVE BOUNTY</p>
                <p className="bf-display text-[1.05rem] leading-none tracking-tightHeading">
                  {adminBountyContext.name}
                </p>
              </div>
              <StatusChip status={adminBountyContext.status} />
            </div>
            <button type="button" className="bf-button-tertiary">
              SWITCH BOUNTY
            </button>
          </div>

          <nav className="flex flex-col">
            {computedNavItems.map((item) => {
              const isActive =
                item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between gap-3 border-l-[3px] border-transparent px-4 py-3 font-mono text-[0.78rem] uppercase tracking-label text-muted transition-colors duration-100 ease-linear hover:text-foreground",
                    isActive ? "border-primary bg-primary/5 text-primary" : ""
                  )}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="bg-surface-high px-2 py-1 font-data text-[0.72rem] text-amber">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4 bg-background p-4">
            {hasHydrated && currentUser ? (
              <>
                <div className="space-y-2">
                  <p className="bf-label">OWNER WALLET</p>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 animate-pulse-dot bg-primary" />
                    <span className="bf-data text-[0.82rem] text-muted">
                      {truncateAddress(currentUser.walletAddress)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await supabase?.auth.signOut();
                    signOut();
                    router.push("/auth");
                    router.refresh();
                  }}
                  className="bf-button-tertiary"
                >
                  LOG OUT
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 bg-surface-high px-4 py-3">
                <span className="h-2 w-2 bg-primary" />
                <span className="bf-label text-foreground">AUTHENTICATED SESSION</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="min-h-screen flex-1 lg:ml-[240px]">{children}</main>
    </div>
  );
}
