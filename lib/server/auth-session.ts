import type { NextRequest, NextResponse } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

const SESSION_STARTED_COOKIE = "bf_session_started_at";
const SESSION_LAST_ACTIVITY_COOKIE = "bf_session_last_activity_at";
const PASSWORD_RESET_EMAIL_COOKIE = "bf_password_reset_email";
const PASSWORD_RESET_REQUESTED_AT_COOKIE = "bf_password_reset_requested_at";

const MINUTE_MS = 60_000;
const DEFAULT_MAX_SESSION_AGE_MS = 8 * 60 * MINUTE_MS;
const DEFAULT_IDLE_TIMEOUT_MS = 30 * MINUTE_MS;
const PASSWORD_RESET_WINDOW_MS = 15 * MINUTE_MS;

function parseDurationMinutes(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * MINUTE_MS : fallback;
}

function isSecureCookieEnvironment(requestUrl?: string) {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  if (requestUrl) {
    try {
      return new URL(requestUrl).protocol === "https:";
    } catch {
      return false;
    }
  }

  return false;
}

export function getSessionMaxAgeMs() {
  return parseDurationMinutes(process.env.AUTH_SESSION_MAX_AGE_MINUTES, DEFAULT_MAX_SESSION_AGE_MS);
}

export function getSessionIdleTimeoutMs() {
  return parseDurationMinutes(
    process.env.AUTH_SESSION_IDLE_TIMEOUT_MINUTES,
    DEFAULT_IDLE_TIMEOUT_MS
  );
}

export function getPasswordResetWindowMs() {
  return PASSWORD_RESET_WINDOW_MS;
}

export function getServerCookieOptions(requestUrl?: string) {
  return {
    httpOnly: true,
    secure: isSecureCookieEnvironment(requestUrl),
    sameSite: "lax" as const,
    path: "/"
  };
}

export function normalizeSupabaseCookieOptions(
  options: Partial<ResponseCookie> | undefined,
  requestUrl?: string
): Partial<ResponseCookie> {
  return {
    ...options,
    secure: options?.secure ?? isSecureCookieEnvironment(requestUrl),
    sameSite: options?.sameSite ?? "lax",
    path: options?.path ?? "/"
  };
}

export function applySessionTrackingCookies(
  response: NextResponse,
  requestUrl?: string,
  now = Date.now()
) {
  const options = getServerCookieOptions(requestUrl);
  response.cookies.set(SESSION_STARTED_COOKIE, String(now), options);
  response.cookies.set(SESSION_LAST_ACTIVITY_COOKIE, String(now), options);
}

export function refreshSessionActivityCookie(
  response: NextResponse,
  requestUrl?: string,
  now = Date.now()
) {
  response.cookies.set(SESSION_LAST_ACTIVITY_COOKIE, String(now), getServerCookieOptions(requestUrl));
}

export function clearSessionTrackingCookies(response: NextResponse, requestUrl?: string) {
  const options = getServerCookieOptions(requestUrl);
  response.cookies.set(SESSION_STARTED_COOKIE, "", { ...options, maxAge: 0 });
  response.cookies.set(SESSION_LAST_ACTIVITY_COOKIE, "", { ...options, maxAge: 0 });
}

export function setPasswordResetCookies(
  response: NextResponse,
  email: string,
  requestUrl?: string,
  now = Date.now()
) {
  const options = getServerCookieOptions(requestUrl);
  response.cookies.set(PASSWORD_RESET_EMAIL_COOKIE, email.trim().toLowerCase(), options);
  response.cookies.set(PASSWORD_RESET_REQUESTED_AT_COOKIE, String(now), options);
}

export function clearPasswordResetCookies(response: NextResponse, requestUrl?: string) {
  const options = getServerCookieOptions(requestUrl);
  response.cookies.set(PASSWORD_RESET_EMAIL_COOKIE, "", { ...options, maxAge: 0 });
  response.cookies.set(PASSWORD_RESET_REQUESTED_AT_COOKIE, "", { ...options, maxAge: 0 });
}

export function readPasswordResetState(
  cookieStore: CookieReader
) {
  return {
    email: cookieStore.get(PASSWORD_RESET_EMAIL_COOKIE)?.value ?? "",
    requestedAt: Number.parseInt(
      cookieStore.get(PASSWORD_RESET_REQUESTED_AT_COOKIE)?.value ?? "",
      10
    )
  };
}

export function getSessionWindowState(
  cookieStore: CookieReader,
  now = Date.now()
) {
  const startedAt = Number.parseInt(cookieStore.get(SESSION_STARTED_COOKIE)?.value ?? "", 10);
  const lastActivityAt = Number.parseInt(
    cookieStore.get(SESSION_LAST_ACTIVITY_COOKIE)?.value ?? "",
    10
  );
  const maxAgeMs = getSessionMaxAgeMs();
  const idleTimeoutMs = getSessionIdleTimeoutMs();

  const missingTracking = !Number.isFinite(startedAt) || !Number.isFinite(lastActivityAt);
  const maxAgeExpired = Number.isFinite(startedAt) && now - startedAt > maxAgeMs;
  const idleExpired = Number.isFinite(lastActivityAt) && now - lastActivityAt > idleTimeoutMs;

  return {
    startedAt,
    lastActivityAt,
    maxAgeMs,
    idleTimeoutMs,
    missingTracking,
    maxAgeExpired,
    idleExpired,
    expired: maxAgeExpired || idleExpired
  };
}

export function clearSupabaseAuthCookies(response: NextResponse, request: NextRequest) {
  const options = getServerCookieOptions(request.url);

  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name === "supabase.auth.token" || (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))) {
      response.cookies.set(cookie.name, "", { ...options, maxAge: 0 });
    }
  });
}
