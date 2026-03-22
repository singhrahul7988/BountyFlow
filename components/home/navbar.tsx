"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAuthHref, getDefaultRouteForRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { useAppStore } from "@/lib/stores/app-store";
import { truncateAddress } from "@/lib/utils";
import { WalletLinkButton } from "../wallet/wallet-link-button";
import { Logo } from "./logo";

export function Navbar() {
  const router = useRouter();
  const [isCompressed, setIsCompressed] = useState(false);
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
  const {
    isMobileNavOpen,
    currentUser,
    hasHydrated,
    walletAddress,
    toggleMobileNav,
    closeMobileNav,
    signOut
  } = useAppStore();

  const dashboardHref = currentUser ? getDefaultRouteForRole(currentUser.role) : "/auth";

  const navLinks = [
    { label: "Bounties", href: "/bounties" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Docs", href: "/docs" }
  ];

  useEffect(() => {
    function handleScroll() {
      setIsCompressed(window.scrollY > 80);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50"
        style={{
          background: "rgba(27, 27, 32, 0.78)",
          backdropFilter: `blur(${isCompressed ? 32 : 24}px)`
        }}
      >
        <div className={`bf-shell mx-auto flex w-full max-w-[1420px] items-center justify-between gap-5 transition-all duration-100 ease-linear ${isCompressed ? "py-3" : "py-4.5"}`}>
          <Link href="/" onClick={closeMobileNav}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[0.68rem] uppercase tracking-label text-muted transition-colors duration-100 ease-linear hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {hasHydrated && currentUser ? (
              <>
                <Link
                  href={getDefaultRouteForRole(currentUser.role)}
                  className="bf-button-secondary px-3.5 py-2.25 text-[0.64rem] text-foreground"
                >
                  {currentUser.walletLinked
                    ? truncateAddress(walletAddress || currentUser.walletAddress)
                    : "DASHBOARD"}
                </Link>
                <WalletLinkButton
                  className="px-3.5 py-2.25 text-[0.64rem]"
                  showHelperText={false}
                  showInlineFeedback={false}
                />
                <button
                  type="button"
                  className="bf-button-primary px-3.5 py-2.25 text-[0.64rem]"
                  onClick={async () => {
                    await supabase?.auth.signOut();
                    signOut();
                    closeMobileNav();
                    router.push("/auth");
                    router.refresh();
                  }}
                >
                  LOG OUT
                </button>
              </>
            ) : (
              <>
                <Link href={dashboardHref} className="bf-button-secondary px-3.5 py-2.25 text-[0.64rem]">
                  DASHBOARD
                </Link>
                <Link href="/auth" className="bf-button-secondary px-3.5 py-2.25 text-[0.64rem]">
                  SIGN IN
                </Link>
                <Link href="/auth" className="bf-button-primary px-3.5 py-2.25 text-[0.64rem]">
                  SIGN UP
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label="Toggle navigation"
            className="flex h-11 w-11 items-center justify-center border border-outline/20 text-primary lg:hidden"
          >
            <span className="relative h-4 w-5">
              <span className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-100 ease-linear ${isMobileNavOpen ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current transition-opacity duration-100 ease-linear ${isMobileNavOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-100 ease-linear ${isMobileNavOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </header>

      {isMobileNavOpen ? (
        <div className="fixed inset-x-5 top-20 z-40 bg-surface-high p-5 lg:hidden">
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMobileNav}
                className="font-mono text-xs uppercase tracking-label text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {hasHydrated && currentUser ? (
              <>
                <Link
                  href={getDefaultRouteForRole(currentUser.role)}
                  onClick={closeMobileNav}
                  className="bf-button-secondary justify-center"
                >
                  {currentUser.walletLinked
                    ? truncateAddress(walletAddress || currentUser.walletAddress)
                    : "DASHBOARD"}
                </Link>
                <WalletLinkButton
                  className="justify-center"
                  showHelperText={false}
                  showInlineFeedback={false}
                />
                <button
                  type="button"
                  className="bf-button-primary justify-center"
                  onClick={async () => {
                    await supabase?.auth.signOut();
                    signOut();
                    closeMobileNav();
                    router.push("/auth");
                    router.refresh();
                  }}
                >
                  LOG OUT
                </button>
              </>
            ) : (
              <>
                <Link
                  href={dashboardHref}
                  onClick={closeMobileNav}
                  className="bf-button-secondary justify-center"
                >
                  DASHBOARD
                </Link>
                <Link href="/auth" onClick={closeMobileNav} className="bf-button-secondary justify-center">
                  SIGN IN
                </Link>
                <Link href="/auth" onClick={closeMobileNav} className="bf-button-primary justify-center">
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
