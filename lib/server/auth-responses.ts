import { NextResponse } from "next/server";

import { clearPasswordResetCookies, clearSessionTrackingCookies } from "./auth-session";

export function buildAuthErrorResponse(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
  requestUrl?: string
) {
  const response = NextResponse.json({ error: message, ...(extra ?? {}) }, { status });

  if (status === 401) {
    clearSessionTrackingCookies(response, requestUrl);
  }

  return response;
}

export function buildAuthSuccessResponse(
  data: Record<string, unknown>,
  requestUrl?: string,
  options?: { clearPasswordReset?: boolean }
) {
  const response = NextResponse.json(data);

  if (options?.clearPasswordReset) {
    clearPasswordResetCookies(response, requestUrl);
  }

  return response;
}
