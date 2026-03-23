import { NextRequest, NextResponse } from "next/server";

import type { UserRole } from "@/lib/auth";
import { buildAuthErrorResponse } from "@/lib/server/auth-responses";
import { clearSessionTrackingCookies, clearSupabaseAuthCookies } from "@/lib/server/auth-session";
import {
  parseJsonObjectBody,
  readEnum,
  readRequiredString
} from "@/lib/server/request-validation";
import { createClient } from "@/lib/supabase/server";

type VerifyEmailBody = {
  email?: string;
  otpCode?: string;
  role?: UserRole;
};

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonObjectBody(request, ["email", "otpCode", "role"]);

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
  const role =
    parsedBody.value.role === undefined
      ? ({ ok: true, value: "researcher" as UserRole } as const)
      : readEnum(parsedBody.value, "role", ["owner", "researcher"] as const);

  if (!email.ok || !otpCode.ok) {
    return buildAuthErrorResponse("Email and OTP are required.", 400, undefined, request.url);
  }

  if (!role.ok) {
    return buildAuthErrorResponse("Selected account role is invalid.", 400, undefined, request.url);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.value,
    token: otpCode.value,
    type: "email"
  });

  if (error) {
    return buildAuthErrorResponse("Verification code is invalid or expired.", 400, undefined, request.url);
  }

  await supabase.auth.signOut({ scope: "global" });

  const response = NextResponse.json({
    ok: true,
    email: email.value,
    role: role.value,
    userId: data.user?.id ?? null,
    message: "Email verified. You can now sign in with your email and password."
  });
  clearSessionTrackingCookies(response, request.url);
  clearSupabaseAuthCookies(response, request);
  return response;
}
