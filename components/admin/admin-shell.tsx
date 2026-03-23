"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { resolveOwnerProgram } from "@/lib/admin-data";
import { adminSubmissions as seededAdminSubmissions } from "@/lib/admin-submissions-data";
import { signOutBrowserSession } from "@/lib/supabase/browser-sign-out";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { useAppStore } from "@/lib/stores/app-store";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { useAuthenticatedDemoStateSync } from "@/lib/use-demo-sync";
import { cn, truncateAddress } from "@/lib/utils";
import { Logo } from "../home/logo";
import { WalletLinkButton } from "../wallet/wallet-link-button";

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
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
  const { currentUser, hasHydrated, signOut } = useAppStore();
  useAuthenticatedDemoStateSync(currentUser?.role === "owner");
  const createdBounties = useDemoDataStore((state) => state.createdBounties);
  const demoAdminSubmissions = useDemoDataStore((state) => state.demoAdminSubmissions);
  const submissionDecisions = useDemoDataStore((state) => state.submissionDecisions);
  const notifications = useDemoDataStore((state) => state.notifications);
  const ownerSettings = useDemoDataStore((state) => state.ownerSettings);
  const ownerProgram = useMemo(() => resolveOwnerProgram(createdBounties), [createdBounties]);

  const adminSubmissions = useMemo(() => {
    const seen = new Set<string>();
    return [...demoAdminSubmissions, ...seededAdminSubmissions]
      .filter(
        (item) =>
          item.bountySlug === ownerProgram.slug ||
          item.bountyName.toUpperCase() === ownerProgram.name.toUpperCase()
      )
      .filter((item) => {
        if (seen.has(item.id)) {
          return false;
        }

        seen.add(item.id);
        return true;
      });
  }, [demoAdminSubmissions, ownerProgram]);

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

  const topNavItems = computedNavItems.filter((item) =>
    ["/admin", "/admin/submissions", "/admin/treasury"].includes(item.href)
  );
  const ownerDisplayName = (
    ownerSettings.ownerDisplayName ||
    currentUser?.name ||
    "PROJECT OWNER"
  ).toUpperCase();
  const sessionStatusLabel =
    hasHydrated && currentUser ? "OWNER SESSION // OPERATIONAL" : "SYNCING SESSION";

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    signOut();
    await signOutBrowserSession(supabase);
    setIsLoggingOut(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <aside className="border-b border-outline/12 bg-surface-low/95 backdrop-blur-sm lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[12.5rem] lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-1.5 p-1.5">
          <Link href="/admin" className="-ml-0.5 inline-flex">
            <Logo compact className="gap-1.5 [&_svg]:h-5 [&_svg]:w-5 [&_span]:text-[0.74rem]" />
          </Link>

          <div className="border border-outline/12 bg-background/80 p-1.5">
            <div className="space-y-1">
              <p className="bf-display text-[0.34rem] leading-none tracking-tightHeading text-foreground">
                {ownerDisplayName}
              </p>
              <p className="bf-label text-[0.38rem] text-primary">OWNER SESSION</p>
            </div>
          </div>

          <nav className="mt-2.5 grid gap-0.5">
            {computedNavItems.map((item) => {
              const isActive =
                item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "grid grid-cols-[0.7rem_minmax(0,1fr)_auto] items-center gap-2 border-l-[3px] px-2.5 py-1.5 transition-colors duration-150",
                    isActive
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-transparent text-muted hover:bg-surface-high/70 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3">
                    {item.icon}
                  </span>
                  <span className="min-w-0 font-mono text-[0.41rem] uppercase tracking-label">
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="bg-background px-2 py-1 font-data text-[0.7rem] text-amber">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2">
            <WalletLinkButton
              className="w-full justify-center px-1.5 py-1.5 text-[0.34rem]"
              showHelperText={false}
              showInlineFeedback={false}
            />

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bf-button-secondary w-full justify-center px-1.5 py-1.5 text-[0.34rem]"
            >
              {isLoggingOut ? "LOGGING OUT..." : "LOG OUT"}
            </button>

            <div className="grid gap-1 border border-outline/12 bg-background/80 p-1.5">
              {currentUser?.walletLinked ? (
                <p className="bf-data text-[0.34rem] text-muted">
                  {truncateAddress(currentUser.walletAddress)}
                </p>
              ) : null}
              <Link
                href="/docs"
                className="font-mono text-[0.34rem] uppercase tracking-label text-muted transition-colors duration-150 hover:text-foreground"
              >
                DOCUMENTATION
              </Link>
              <Link
                href="/docs"
                className="font-mono text-[0.34rem] uppercase tracking-label text-muted transition-colors duration-150 hover:text-foreground"
              >
                SUPPORT
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 lg:ml-[12.5rem]">
        <header className="border-b border-outline/12 bg-background/95 px-2.5 py-2 backdrop-blur-sm lg:fixed lg:left-[12.5rem] lg:right-0 lg:top-0 lg:z-20 lg:px-3">
          <div className="mx-auto flex w-full max-w-[78rem] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="border border-outline/12 bg-surface-high px-2.5 py-1.5">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 animate-pulse-dot bg-primary" />
                  <span className="bf-label text-[0.48rem] text-primary">{sessionStatusLabel}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {topNavItems.map((item) => {
                  const isActive =
                    item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-[0.54rem] transition-colors duration-150 hover:text-foreground",
                        isActive ? "text-primary" : "text-muted"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/admin/notifications"
                className={cn(
                  "text-muted transition-colors duration-150 hover:text-foreground",
                  pathname.startsWith("/admin/notifications") ? "text-primary" : ""
                )}
                aria-label="Open notifications"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M8 2.5A3 3 0 0 1 11 5.5V8L12.5 10.5H3.5L5 8V5.5A3 3 0 0 1 8 2.5z" />
                  <path d="M6.5 12.5A1.5 1.5 0 0 0 9.5 12.5" />
                </svg>
              </Link>
              <Link
                href="/admin/settings"
                className={cn(
                  "text-muted transition-colors duration-150 hover:text-foreground",
                  pathname.startsWith("/admin/settings") ? "text-primary" : ""
                )}
                aria-label="Open settings"
              >
                <svg viewBox="0 0 50 50" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.2 3h5.5l1 5.8c1.6.4 3 .9 4.3 1.7l4.8-3.4 3.9 3.9-3.4 4.8c.8 1.3 1.3 2.8 1.7 4.3l5.8 1v5.5l-5.8 1c-.4 1.5-.9 3-1.7 4.3l3.4 4.8-3.9 3.9-4.8-3.4c-1.3.8-2.8 1.3-4.3 1.7l-1 5.8h-5.5l-1-5.8c-1.5-.4-3-.9-4.3-1.7l-4.8 3.4-3.9-3.9 3.4-4.8c-.8-1.3-1.3-2.8-1.7-4.3l-5.8-1v-5.5l5.8-1c.4-1.5.9-3 1.7-4.3l-3.4-4.8 3.9-3.9 4.8 3.4c1.3-.8 2.8-1.3 4.3-1.7z" />
                  <circle cx="25" cy="25" r="6" />
                </svg>
              </Link>
              <WalletLinkButton
                className="min-w-[6.75rem] justify-center px-2 py-1.5 text-[0.46rem]"
                showHelperText={false}
                showInlineFeedback={false}
              />
            </div>
          </div>
        </header>

        <div className="px-2.5 py-3 md:px-3 lg:px-3 lg:pb-4 lg:pt-[3.9rem]">
          <div className="mx-auto w-full max-w-[78rem]">{children}</div>
        </div>
      </main>
    </div>
  );
}
