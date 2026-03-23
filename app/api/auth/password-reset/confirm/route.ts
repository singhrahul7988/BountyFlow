import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { validatePasswordStrength } from "@/lib/server/auth-password";
import { buildAuthErrorResponse } from "@/lib/server/auth-responses";
import {
  clearPasswordResetCookies,
  clearSessionTrackingCookies,
  clearSupabaseAuthCookies,
  getPasswordResetWindowMs,
  readPasswordResetState
} from "@/lib/server/auth-session";
import { createClient } from "@/lib/supabase/server";

type PasswordResetConfirmBody = {
  email?: string;
  otpCode?: string;
  newPassword?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as PasswordResetConfirmBody | null;
  const email = body?.email?.trim().toLowerCase() || "";
  const otpCode = body?.otpCode?.trim() || "";
  const newPassword = body?.newPassword || "";

  if (!email || !otpCode || !newPassword) {
    return buildAuthErrorResponse(
      "Email, OTP, and new password are required.",
      400,
      undefined,
      request.url
    );
  }

  const passwordError = validatePasswordStrength(newPassword);

  if (passwordError) {
    return buildAuthErrorResponse(passwordError, 400, undefined, request.url);
  }

  const cookieStore = cookies();
  const resetState = readPasswordResetState(cookieStore);
  const now = Date.now();

  if (!resetState.email || resetState.email !== email) {
    return buildAuthErrorResponse(
      "Password reset session is invalid. Request a new reset code.",
      400,
      undefined,
      request.url
    );
  }

  if (!Number.isFinite(resetState.requestedAt) || now - resetState.requestedAt > getPasswordResetWindowMs()) {
    const response = buildAuthErrorResponse(
      "Password reset code expired. Request a new reset code.",
      400,
      undefined,
      request.url
    );
    clearPasswordResetCookies(response, request.url);
    return response;
  }

  const supabase = createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: otpCode,
    type: "recovery"
  });

  if (verifyError) {
    return buildAuthErrorResponse(verifyError.message, 400, undefined, request.url);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (updateError) {
    return buildAuthErrorResponse(updateError.message, 400, undefined, request.url);
  }

  await supabase.auth.signOut({ scope: "global" });

  const response = NextResponse.json({
    ok: true,
    message: "Password updated. Sign in with your new password."
  });
  clearPasswordResetCookies(response, request.url);
  clearSessionTrackingCookies(response, request.url);
  clearSupabaseAuthCookies(response, request);
  return response;
}
