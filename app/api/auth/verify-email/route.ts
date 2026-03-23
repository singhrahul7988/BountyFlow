import { NextRequest, NextResponse } from "next/server";

import type { UserRole } from "@/lib/auth";
import { buildAuthErrorResponse } from "@/lib/server/auth-responses";
import { clearSessionTrackingCookies, clearSupabaseAuthCookies } from "@/lib/server/auth-session";
import { createClient } from "@/lib/supabase/server";

type VerifyEmailBody = {
  email?: string;
  otpCode?: string;
  role?: UserRole;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as VerifyEmailBody | null;
  const email = body?.email?.trim().toLowerCase() || "";
  const otpCode = body?.otpCode?.trim() || "";

  if (!email || !otpCode) {
    return buildAuthErrorResponse("Email and OTP are required.", 400, undefined, request.url);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otpCode,
    type: "email"
  });

  if (error) {
    return buildAuthErrorResponse(error.message, 400, undefined, request.url);
  }

  await supabase.auth.signOut({ scope: "global" });

  const response = NextResponse.json({
    ok: true,
    email,
    role: body?.role === "owner" ? "owner" : "researcher",
    userId: data.user?.id ?? null,
    message: "Email verified. You can now sign in with your email and password."
  });
  clearSessionTrackingCookies(response, request.url);
  clearSupabaseAuthCookies(response, request);
  return response;
}
