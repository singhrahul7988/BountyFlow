import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { normalizeSupabaseCookieOptions } from "@/lib/server/auth-session";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, normalizeSupabaseCookieOptions(options));
          });
        } catch {
          // Server Components cannot always write cookies during render.
        }
      }
    }
  });
}
