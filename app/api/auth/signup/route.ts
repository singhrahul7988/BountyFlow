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
import {
  parseJsonObjectBody,
  readEnum,
  readOptionalString,
  readRequiredString
} from "@/lib/server/request-validation";
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
  const parsedBody = await parseJsonObjectBody(request, [
    "name",
    "email",
    "password",
    "walletAddress",
    "role",
    "captchaToken"
  ]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const name = readRequiredString(parsedBody.value, "name", { maxLength: 80 });
  const email = readRequiredString(parsedBody.value, "email", {
    maxLength: 320,
    lowercase: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  });
  const password = readRequiredString(parsedBody.value, "password", { maxLength: 128 });
  const walletAddress = readOptionalString(parsedBody.value, "walletAddress", { maxLength: 120 });
  const role =
    parsedBody.value.role === undefined
      ? ({ ok: true, value: "researcher" as UserRole } as const)
      : readEnum(parsedBody.value, "role", ["owner", "researcher"] as const);
  const captchaToken = readOptionalString(parsedBody.value, "captchaToken", { maxLength: 4000 });

  if (!name.ok || !email.ok || !password.ok) {
    return buildAuthErrorResponse("Name, email, and password are required.", 400, undefined, request.url);
  }

  if (!walletAddress.ok) {
    return buildAuthErrorResponse("Wallet address is invalid.", 400, undefined, request.url);
  }

  if (!role.ok) {
    return buildAuthErrorResponse("Selected account role is invalid.", 400, undefined, request.url);
  }

  if (!captchaToken.ok) {
    return buildAuthErrorResponse("CAPTCHA verification failed.", 400, undefined, request.url);
  }

  const passwordError = validatePasswordStrength(password.value);

  if (passwordError) {
    return buildAuthErrorResponse(passwordError, 400, undefined, request.url);
  }

  if (role.value === "owner" && !isAllowedOwnerEmail(email.value)) {
    return buildAuthErrorResponse("This email is not approved for project owner access.", 403, undefined, request.url);
  }

  const rateLimit = getAuthRateLimitStatus(request, "signup", email.value);

  if (rateLimit.locked) {
    return buildAuthErrorResponse(
      "Too many sign-up attempts. Try again later.",
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: getEmailRedirectTo(request, role.value),
      data: {
        role: role.value,
        name: name.value,
        walletAddress: walletAddress.value || ""
      }
    }
  });

  if (error) {
    recordAuthFailure(rateLimit.key);
    return buildAuthErrorResponse("Unable to create the account.", 400, undefined, request.url);
  }

  clearAuthFailures(rateLimit.key);
  await supabase.auth.signOut();

  return NextResponse.json({
    ok: true,
    message: `Verification code sent to ${email.value}. Enter the OTP to verify your email.`
  });
}
