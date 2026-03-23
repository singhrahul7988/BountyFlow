import { NextRequest, NextResponse } from "next/server";

import {
  applySessionTrackingCookies,
  clearSessionTrackingCookies,
  clearSupabaseAuthCookies,
  getSessionWindowState
} from "@/lib/server/auth-session";
import { getAuthUserFromProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const sessionState = getSessionWindowState(request.cookies);
  const supabase = createClient();

  if (sessionState.expired) {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      await supabase.auth.signOut();
    }

    const response = NextResponse.json({ user: null });
    clearSessionTrackingCookies(response, request.url);
    clearSupabaseAuthCookies(response, request);
    return response;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  if (!user.email_confirmed_at) {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      await supabase.auth.signOut();
    }

    const response = NextResponse.json({ user: null });
    clearSessionTrackingCookies(response, request.url);
    clearSupabaseAuthCookies(response, request);
    return response;
  }

  const mapped = await getAuthUserFromProfile(supabase, user);

  if (!mapped) {
    return NextResponse.json({ user: null });
  }

  const response = NextResponse.json({ user: mapped });

  if (sessionState.missingTracking) {
    applySessionTrackingCookies(response, request.url);
  }

  return response;
}
