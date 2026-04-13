import { NextRequest, NextResponse } from "next/server";

import { getDefaultRouteForRole, type UserRole } from "@/lib/auth";
import { clearAuthFailures, getAuthRateLimitStatus, recordAuthFailure } from "@/lib/server/auth-rate-limit";
import { buildAuthErrorResponse } from "@/lib/server/auth-responses";
import { applySessionTrackingCookies, clearPasswordResetCookies } from "@/lib/server/auth-session";
import { isCaptchaConfigured, verifyCaptchaToken } from "@/lib/server/captcha";
import {
  parseJsonObjectBody,
  readEnum,
  readOptionalString,
  readRequiredString
} from "@/lib/server/request-validation";
import { getAuthUserFromProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

type LoginBody = {
  email?: string;
  password?: string;
  role?: UserRole;
  captchaToken?: string;
};

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonObjectBody(request, [
    "email",
    "password",
    "role",
    "captchaToken"
  ]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const email = readRequiredString(parsedBody.value, "email", {
    maxLength: 320,
    lowercase: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  });
  const password = readRequiredString(parsedBody.value, "password", { maxLength: 128 });
  const requestedRole =
    parsedBody.value.role === undefined
      ? ({ ok: true, value: undefined } as const)
      : readEnum(parsedBody.value, "role", ["owner", "researcher"] as const);
  const captchaToken = readOptionalString(parsedBody.value, "captchaToken", { maxLength: 4000 });

  if (!email.ok) {
    return buildAuthErrorResponse("Email and password are required.", 400, undefined, request.url);
  }

  if (!password.ok) {
    return buildAuthErrorResponse("Email and password are required.", 400, undefined, request.url);
  }

  if (!requestedRole.ok) {
    return buildAuthErrorResponse("Selected account role is invalid.", 400, undefined, request.url);
  }

  if (!captchaToken.ok) {
    return buildAuthErrorResponse("CAPTCHA verification failed.", 400, undefined, request.url);
  }

  const rateLimit = getAuthRateLimitStatus(request, "login", email.value);

  if (rateLimit.locked) {
    return buildAuthErrorResponse(
      "Too many failed login attempts. Try again later.",
      429,
      {
        requiresCaptcha: isCaptchaConfigured(),
        retryAfterMs: rateLimit.retryAfterMs
      },
      request.url
    );
  }

  if (rateLimit.requiresCaptcha) {
    const captchaResult = await verifyCaptchaToken(captchaToken.value, request.headers.get("x-forwarded-for"));

    if (!captchaResult.ok) {
      return buildAuthErrorResponse(
        captchaResult.reason || "CAPTCHA verification failed.",
        400,
        { requiresCaptcha: true },
        request.url
      );
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });

  if (error) {
    recordAuthFailure(rateLimit.key);
    return buildAuthErrorResponse(
      "Invalid email or password.",
      401,
      { requiresCaptcha: isCaptchaConfigured() || rateLimit.requiresCaptcha },
      request.url
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const mapped = await getAuthUserFromProfile(supabase, user);

  if (!mapped) {
    await supabase.auth.signOut({ scope: "global" });
    return buildAuthErrorResponse("Your account profile is missing.", 403, undefined, request.url);
  }

  if (!user?.email_confirmed_at) {
    await supabase.auth.signOut({ scope: "global" });
    return buildAuthErrorResponse("Verify your email before signing in.", 403, undefined, request.url);
  }

  if (requestedRole.value && mapped.role !== requestedRole.value) {
    await supabase.auth.signOut({ scope: "global" });
    return buildAuthErrorResponse(
      `This account is registered as ${mapped.role}, not ${requestedRole.value}.`,
      403,
      undefined,
      request.url
    );
  }

  clearAuthFailures(rateLimit.key);

  const response = NextResponse.json({
    user: mapped,
    nextPath: getDefaultRouteForRole(mapped.role)
  });

  applySessionTrackingCookies(response, request.url);
  clearPasswordResetCookies(response, request.url);

  return response;
}
