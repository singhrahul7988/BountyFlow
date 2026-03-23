import { NextRequest, NextResponse } from "next/server";

import { isAllowedOwnerEmail, type UserRole } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/server/auth-password";
import {
  clearAuthFailures,
  getAuthRateLimitStatus,
  recordAuthFailure
} from "@/lib/server/auth-rate-limit";
import { buildAuthErrorResponse } from "@/lib/server/auth-responses";
import { isCaptchaConfigured, verifyCaptchaToken } from "@/lib/server/captcha";
import { createClient } from "@/lib/supabase/server";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  walletAddress?: string;
  role?: UserRole;
  captchaToken?: string;
};

function getEmailRedirectTo(request: NextRequest, role: UserRole) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL("/", request.url).toString();
  const target = new URL("/auth/confirmed", baseUrl);
  target.searchParams.set("role", role);
  return target.toString();
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SignupBody | null;
  const name = body?.name?.trim() || "";
  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password || "";
  const walletAddress = body?.walletAddress?.trim() || "";
  const role = body?.role === "owner" ? "owner" : "researcher";

  if (!name || !email || !password) {
    return buildAuthErrorResponse("Name, email, and password are required.", 400, undefined, request.url);
  }

  const passwordError = validatePasswordStrength(password);

  if (passwordError) {
    return buildAuthErrorResponse(passwordError, 400, undefined, request.url);
  }

  if (role === "owner" && !isAllowedOwnerEmail(email)) {
    return buildAuthErrorResponse("This email is not approved for project owner access.", 403, undefined, request.url);
  }

  const rateLimit = getAuthRateLimitStatus(request, "signup", email);

  if (rateLimit.locked) {
    return buildAuthErrorResponse(
      "Too many sign-up attempts. Try again later.",
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
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectTo(request, role),
      data: {
        role,
        name,
        walletAddress
      }
    }
  });

  if (error) {
    recordAuthFailure(rateLimit.key);
    return buildAuthErrorResponse(error.message, 400, undefined, request.url);
  }

  clearAuthFailures(rateLimit.key);
  await supabase.auth.signOut();

  return NextResponse.json({
    ok: true,
    message: `Verification code sent to ${email}. Enter the OTP to verify your email.`
  });
}
