import { NextRequest, NextResponse } from "next/server";

import {
  clearPasswordResetCookies,
  clearSupabaseAuthCookies,
  clearSessionTrackingCookies
} from "@/lib/server/auth-session";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    await supabase.auth.signOut();
  }

  const response = NextResponse.json({ ok: true });
  clearSessionTrackingCookies(response, request.url);
  clearPasswordResetCookies(response, request.url);
  clearSupabaseAuthCookies(response, request);

  return response;
}
