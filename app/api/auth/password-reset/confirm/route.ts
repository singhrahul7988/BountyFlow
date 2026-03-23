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
import {
  parseJsonObjectBody,
  readRequiredString
} from "@/lib/server/request-validation";
import { createClient } from "@/lib/supabase/server";

type PasswordResetConfirmBody = {
  email?: string;
  otpCode?: string;
  newPassword?: string;
};

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonObjectBody(request, ["email", "otpCode", "newPassword"]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const email = readRequiredString(parsedBody.value, "email", {
    maxLength: 320,
    lowercase: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  });
  const otpCode = readRequiredString(parsedBody.value, "otpCode", {
    minLength: 4,
    maxLength: 12,
    pattern: /^[A-Za-z0-9-]+$/
  });
  const newPassword = readRequiredString(parsedBody.value, "newPassword", { maxLength: 128 });

  if (!email.ok || !otpCode.ok || !newPassword.ok) {
    return buildAuthErrorResponse(
      "Email, OTP, and new password are required.",
      400,
      undefined,
      request.url
    );
  }

  const passwordError = validatePasswordStrength(newPassword.value);

  if (passwordError) {
    return buildAuthErrorResponse(passwordError, 400, undefined, request.url);
  }

  const cookieStore = cookies();
  const resetState = readPasswordResetState(cookieStore);
  const now = Date.now();

  if (!resetState.email || resetState.email !== email.value) {
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
    email: email.value,
    token: otpCode.value,
    type: "recovery"
  });

  if (verifyError) {
    return buildAuthErrorResponse("Password reset code is invalid or expired.", 400, undefined, request.url);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword.value
  });

  if (updateError) {
    return buildAuthErrorResponse("Unable to update the password.", 400, undefined, request.url);
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
