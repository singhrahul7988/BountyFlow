import { NextRequest, NextResponse } from "next/server";

import { clearAuthFailures, getAuthRateLimitStatus, recordAuthFailure } from "@/lib/server/auth-rate-limit";
import { buildAuthErrorResponse } from "@/lib/server/auth-responses";
import { setPasswordResetCookies } from "@/lib/server/auth-session";
import { isCaptchaConfigured, verifyCaptchaToken } from "@/lib/server/captcha";
import {
  parseJsonObjectBody,
  readOptionalString,
  readRequiredString
} from "@/lib/server/request-validation";
import { createClient } from "@/lib/supabase/server";

type PasswordResetRequestBody = {
  email?: string;
  captchaToken?: string;
};

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonObjectBody(request, ["email", "captchaToken"]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const email = readRequiredString(parsedBody.value, "email", {
    maxLength: 320,
    lowercase: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  });
  const captchaToken = readOptionalString(parsedBody.value, "captchaToken", { maxLength: 4000 });

  if (!email.ok) {
    return buildAuthErrorResponse("Email is required.", 400, undefined, request.url);
  }

  if (!captchaToken.ok) {
    return buildAuthErrorResponse("CAPTCHA verification failed.", 400, undefined, request.url);
  }

  const rateLimit = getAuthRateLimitStatus(request, "password-reset", email.value);

  if (rateLimit.locked) {
    return buildAuthErrorResponse(
      "Too many reset attempts. Try again later.",
      429,
      { requiresCaptcha: isCaptchaConfigured(), retryAfterMs: rateLimit.retryAfterMs },
      request.url
    );
  }

  const captchaResult = await verifyCaptchaToken(captchaToken.value, request.headers.get("x-forwarded-for"));

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
  const { error } = await supabase.auth.resetPasswordForEmail(email.value);

  if (error) {
    recordAuthFailure(rateLimit.key);
    return buildAuthErrorResponse("Unable to send a password reset code.", 400, undefined, request.url);
  }

  clearAuthFailures(rateLimit.key);

  const response = NextResponse.json({
    ok: true,
    message: `Password reset code sent to ${email.value}. Enter the OTP and your new password to continue.`
  });
  setPasswordResetCookies(response, email.value, request.url);
  return response;
}
