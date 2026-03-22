"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getAuthUserFromProfile } from "@/lib/supabase/profiles";
import { useAppStore } from "@/lib/stores/app-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
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
    if (!supabase) {
      setHydrated(true);
      return;
    }

    let isMounted = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!isMounted) {
        return;
      }

      const mapped = await getAuthUserFromProfile(supabase, data.user);

      if (mapped) {
        signIn(mapped);
      } else {
        signOut();
      }

      setHydrated(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const mapped = await getAuthUserFromProfile(supabase, session?.user);

      if (mapped) {
        signIn(mapped);
      } else {
        signOut();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setHydrated, signIn, signOut, supabase]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
