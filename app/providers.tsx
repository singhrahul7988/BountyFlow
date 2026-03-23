"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import type { AuthUser } from "@/lib/auth";
import { useAppStore } from "@/lib/stores/app-store";
import { wagmiConfig } from "@/lib/web3/wagmi-config";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  const { signIn, signOut, setHydrated } = useAppStore();

  useEffect(() => {
    let isMounted = true;

    async function syncCurrentUser() {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Unable to restore the current session.");
      }

      return (await response.json()) as { user: AuthUser | null };
    }

    async function hydrate() {
      try {
        const data = await syncCurrentUser();

        if (!isMounted) {
          return;
        }

        if (data.user) {
          signIn(data.user);
        } else {
          signOut();
        }
      } catch {
        if (!isMounted) {
          return;
        }

        signOut();
      } finally {
        if (isMounted) {
          setHydrated(true);
        }
      }
    }

    void hydrate();

    function handleAuthRefresh() {
      void hydrate();
    }

    function handleFocus() {
      void hydrate();
    }

    window.addEventListener("bf-auth-refresh", handleAuthRefresh);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("bf-auth-refresh", handleAuthRefresh);
      window.removeEventListener("focus", handleFocus);
    };
  }, [setHydrated, signIn, signOut]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
