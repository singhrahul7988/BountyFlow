import { NextRequest, NextResponse } from "next/server";

import { clearAuthFailures, getAuthRateLimitStatus, recordAuthFailure } from "@/lib/server/auth-rate-limit";
import { buildAuthErrorResponse } from "@/lib/server/auth-responses";
import { setPasswordResetCookies } from "@/lib/server/auth-session";
import { isCaptchaConfigured, verifyCaptchaToken } from "@/lib/server/captcha";
import { createClient } from "@/lib/supabase/server";

type PasswordResetRequestBody = {
  email?: string;
  captchaToken?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as PasswordResetRequestBody | null;
  const email = body?.email?.trim().toLowerCase() || "";

  if (!email) {
    return buildAuthErrorResponse("Email is required.", 400, undefined, request.url);
  }

  const rateLimit = getAuthRateLimitStatus(request, "password-reset", email);

  if (rateLimit.locked) {
    return buildAuthErrorResponse(
      "Too many reset attempts. Try again later.",
      429,
      { requiresCaptcha: isCaptchaConfigured(), retryAfterMs: rateLimit.retryAfterMs },
      request.url
    );
  }

  const captchaResult = await verifyCaptchaToken(body?.captchaToken, request.headers.get("x-forwarded-for"));

  if (!captchaResult.ok) {
    recordAuthFailure(rateLimit.key);
    return buildAuthErrorResponse(
      captchaResult.reason || "CAPTCHA verification failed.",
      400,
      { requiresCaptcha: isCaptchaConfigured() },
      request.url
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    recordAuthFailure(rateLimit.key);
    return buildAuthErrorResponse(error.message, 400, undefined, request.url);
  }

  clearAuthFailures(rateLimit.key);

  const response = NextResponse.json({
    ok: true,
    message: `Password reset code sent to ${email}. Enter the OTP and your new password to continue.`
  });
  setPasswordResetCookies(response, email, request.url);
  return response;
}
