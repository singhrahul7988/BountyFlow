import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeSupabaseCookieOptions } from "@/lib/server/auth-session";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, normalizeSupabaseCookieOptions(options, request.url))
        );
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
