import type { NextRequest } from "next/server";

type RateLimitRecord = {
  count: number;
  firstAttemptAt: number;
  lockoutUntil: number | null;
};

const store = new Map<string, RateLimitRecord>();

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOCKOUT_MS = 15 * 60_000;
const CAPTCHA_AFTER_ATTEMPTS = 3;

function getNow() {
  return Date.now();
}

function getClientIp(request: NextRequest | Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function getKey(action: string, identifier: string, ip: string) {
  return `${action}:${identifier.trim().toLowerCase()}:${ip}`;
}

function getRecord(key: string, now = getNow()) {
  const current = store.get(key);

  if (!current) {
    return null;
  }

  if (current.lockoutUntil && current.lockoutUntil > now) {
    return current;
  }

  if (now - current.firstAttemptAt > LOGIN_WINDOW_MS) {
    store.delete(key);
    return null;
  }

  return current;
}

export function getAuthRateLimitStatus(
  request: NextRequest | Request,
  action: "login" | "signup" | "password-reset",
  identifier: string
) {
  const ip = getClientIp(request);
  const key = getKey(action, identifier, ip);
  const now = getNow();
  const record = getRecord(key, now);
  const requiresCaptcha = Boolean(record && record.count >= CAPTCHA_AFTER_ATTEMPTS);
  const locked = Boolean(record?.lockoutUntil && record.lockoutUntil > now);

  return {
    key,
    locked,
    requiresCaptcha,
    retryAfterMs: locked && record?.lockoutUntil ? Math.max(0, record.lockoutUntil - now) : 0
  };
}

export function recordAuthFailure(key: string) {
  const now = getNow();
  const current = getRecord(key, now);

  if (!current) {
    store.set(key, {
      count: 1,
      firstAttemptAt: now,
      lockoutUntil: null
    });
    return;
  }

  const nextCount = current.count + 1;
  const nextLockoutUntil = nextCount >= LOGIN_LIMIT ? now + LOCKOUT_MS : null;

  store.set(key, {
    count: nextCount,
    firstAttemptAt: current.firstAttemptAt,
    lockoutUntil: nextLockoutUntil
  });
}

export function clearAuthFailures(key: string) {
  store.delete(key);
}
