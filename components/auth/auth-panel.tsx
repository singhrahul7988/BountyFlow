"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getDefaultRouteForRole, type AuthUser, type UserRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { useAppStore } from "@/lib/stores/app-store";
import { TurnstileWidget } from "./turnstile-widget";

const authModes = ["LOGIN", "SIGN UP"] as const;
const roles: { label: string; value: UserRole; body: string }[] = [
  {
    label: "RESEARCHER",
    value: "researcher",
    body: "Access the researcher dashboard, submit findings, and track payout status."
  },
  {
    label: "PROJECT OWNER",
    value: "owner",
    body: "Access the owner panel, review submissions, and manage the treasury."
  }
];

const AUTH_TIMEOUT_MS = 15_000;
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type AuthApiResponse = {
  error?: string;
  message?: string;
  user?: AuthUser | null;
  nextPath?: string;
  requiresCaptcha?: boolean;
  retryAfterMs?: number;
};

async function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = AUTH_TIMEOUT_MS) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function formatAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("password must be at least 8 characters") ||
    normalized.includes("uppercase, lowercase, and numeric")
  ) {
    return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
  }

  if (normalized.includes("invalid email or password")) {
    return "Invalid email or password.";
  }

  if (normalized.includes("email address not authorized")) {
    return "Supabase default email delivery only sends to authorized team addresses. Add this email to your Supabase team or configure custom SMTP.";
  }

  if (
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("too many emails") ||
    normalized.includes("email rate limit")
  ) {
    return "Email sending is rate-limited in Supabase right now. Wait a bit or configure custom SMTP.";
  }

  return message;
}

async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(body)
  });

  const payload = (await response.json().catch(() => ({}))) as T;
  return { response, payload };
}

function dispatchAuthRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bf-auth-refresh"));
  }
}

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, hasHydrated, signIn, signOut } = useAppStore();
  const [mode, setMode] = useState<(typeof authModes)[number]>("LOGIN");
  const [role, setRole] = useState<UserRole>(
    searchParams.get("role") === "owner" ? "owner" : "researcher"
  );
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    otpCode: "",
    walletAddress: "",
    captchaToken: ""
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);

  const nextPath = searchParams.get("next");
  const confirmed = searchParams.get("confirmed");
  const loggedOut = searchParams.get("logged_out");

  useEffect(() => {
    if (!hasHydrated || !currentUser || confirmed === "1") {
      return;
    }

    router.replace(nextPath || getDefaultRouteForRole(currentUser.role));
  }, [confirmed, currentUser, hasHydrated, nextPath, router]);

  const helperCopy = useMemo(() => {
    const reason = searchParams.get("reason");

    if (confirmed === "1") {
      return "Email confirmed. Sign in with your email and password to continue.";
    }

    if (loggedOut === "1") {
      return "Signed out successfully.";
    }

    if (reason === "session_expired") {
      return "Your session expired. Sign in again to continue.";
    }

    if (reason === "email_unverified") {
      return "Verify your email before accessing protected routes.";
    }

    if (reason === "role") {
      return "That route is restricted to a different account type. Sign in with the correct role to continue.";
    }

    if (reason === "auth") {
      return "Sign in to access protected researcher and owner routes.";
    }

    return "Authenticate with the role that matches the area of the platform you need to access.";
  }, [confirmed, loggedOut, searchParams]);

  function updateField(key: keyof typeof formState, value: string) {
    setFormState((current) => ({ ...current, [key]: value }));
    setError("");
    setNotice("");
  }

  function resetTransientState() {
    setError("");
    setNotice("");
    setRequiresCaptcha(false);
    setFormState((current) => ({ ...current, otpCode: "", captchaToken: "" }));
  }

  useEffect(() => {
    setOtpStep("request");
    setResetStep("request");
    resetTransientState();
  }, [mode, role, resetMode]);

  async function finalizeSignedInUser(user: AuthUser, next?: string) {
    signIn(user);
    dispatchAuthRefresh();
    router.push(next || nextPath || getDefaultRouteForRole(user.role));
    router.refresh();
  }

  async function handleLogin() {
    if (!formState.email.trim() || !formState.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    const { response, payload } = await withTimeout(
      postJson<AuthApiResponse>("/api/auth/login", {
        email: formState.email.trim(),
        password: formState.password,
        role,
        captchaToken: formState.captchaToken
      }),
      "Sign in timed out. Check your connection and try again."
    );

    setRequiresCaptcha(Boolean(payload.requiresCaptcha));

    if (!response.ok || !payload.user) {
      setError(formatAuthErrorMessage(payload.error || "Sign in failed."));
      return;
    }

    await finalizeSignedInUser(payload.user, payload.nextPath);
  }

  async function handleSignupRequest() {
    if (!formState.name.trim() || !formState.email.trim() || !formState.password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    const { response, payload } = await withTimeout(
      postJson<AuthApiResponse>("/api/auth/signup", {
        name: formState.name.trim(),
        email: formState.email.trim(),
        password: formState.password,
        walletAddress: formState.walletAddress.trim(),
        role,
        captchaToken: formState.captchaToken
      }),
      "Sign up timed out. Check your connection and try again."
    );

    setRequiresCaptcha(Boolean(payload.requiresCaptcha));

    if (!response.ok) {
      setError(formatAuthErrorMessage(payload.error || "Sign up failed."));
      return;
    }

    setOtpStep("verify");
    setNotice(payload.message || `Verification code sent to ${formState.email.trim()}.`);
  }

  async function handleSignupVerify() {
    const { response, payload } = await withTimeout(
      postJson<AuthApiResponse>("/api/auth/verify-email", {
        email: formState.email.trim(),
        otpCode: formState.otpCode.trim(),
        role
      }),
      "OTP verification timed out while verifying your email."
    );

    if (!response.ok) {
      setError(formatAuthErrorMessage(payload.error || "OTP verification failed."));
      return;
    }

    signOut();
    dispatchAuthRefresh();
    setMode("LOGIN");
    setOtpStep("request");
    setFormState({
      name: "",
      email: "",
      password: "",
      otpCode: "",
      walletAddress: "",
      captchaToken: ""
    });
    setNotice(payload.message || "Email verified. You can now sign in.");
  }

  async function handleResetRequest() {
    if (!formState.email.trim()) {
      setError("Email is required.");
      return;
    }

    const { response, payload } = await withTimeout(
      postJson<AuthApiResponse>("/api/auth/password-reset/request", {
        email: formState.email.trim(),
        captchaToken: formState.captchaToken
      }),
      "Password reset request timed out. Try again."
    );

    setRequiresCaptcha(Boolean(payload.requiresCaptcha));

    if (!response.ok) {
      setError(formatAuthErrorMessage(payload.error || "Password reset request failed."));
      return;
    }

    setResetStep("confirm");
    setNotice(payload.message || `Reset code sent to ${formState.email.trim()}.`);
  }

  async function handleResetConfirm() {
    if (!formState.email.trim() || !formState.otpCode.trim() || !formState.password.trim()) {
      setError("Email, reset code, and new password are required.");
      return;
    }

    const { response, payload } = await withTimeout(
      postJson<AuthApiResponse>("/api/auth/password-reset/confirm", {
        email: formState.email.trim(),
        otpCode: formState.otpCode.trim(),
        newPassword: formState.password
      }),
      "Password reset confirmation timed out. Try again."
    );

    if (!response.ok) {
      setError(formatAuthErrorMessage(payload.error || "Password reset failed."));
      return;
    }

    setResetMode(false);
    setResetStep("request");
    setFormState((current) => ({
      ...current,
      password: "",
      otpCode: "",
      captchaToken: ""
    }));
    setNotice(payload.message || "Password updated. Sign in with your new password.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseEnv()) {
      setError("Supabase environment variables are not configured yet.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      if (resetMode) {
        if (resetStep === "request") {
          await handleResetRequest();
        } else {
          await handleResetConfirm();
        }
        return;
      }

      if (mode === "SIGN UP") {
        if (otpStep === "request") {
          await handleSignupRequest();
        } else {
          await handleSignupVerify();
        }
        return;
      }

      await handleLogin();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? formatAuthErrorMessage(submissionError.message)
          : "Authentication failed. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const showCaptcha = requiresCaptcha && Boolean(turnstileSiteKey);

  return (
    <section className="bf-shell pt-32 pb-24">
      <div className="mx-auto w-full max-w-[1420px]">
        <div className="grid gap-8 xl:grid-cols-[0.52fr_0.48fr]">
          <div className="space-y-6 bg-surface-low p-8 md:p-10">
            <p className="bf-label text-primary">ROLE-BASED ACCESS</p>
            <h1 className="bf-display text-[2.6rem] leading-none tracking-tightHeading sm:text-[4rem]">
              SIGN IN TO
              <span className="block">BOUNTYFLOW</span>
            </h1>
            <p className="max-w-2xl text-[1rem] leading-8 text-muted">{helperCopy}</p>

            <div className="grid gap-4 md:grid-cols-2">
              {roles.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRole(item.value)}
                  className={`space-y-4 border p-5 text-left transition-colors duration-100 ease-linear ${
                    role === item.value
                      ? "border-primary bg-surface-high shadow-[0_0_0_1px_rgba(99,255,205,0.35)]"
                      : "border-outline/12 bg-background hover:border-outline/25 hover:bg-surface-high"
                  }`}
                >
                  <p className={`bf-label ${role === item.value ? "text-primary" : "text-muted"}`}>
                    {item.label}
                  </p>
                  <p className="text-sm leading-7 text-muted">{item.body}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 bg-surface-low p-8 md:p-10">
            {!resetMode ? (
              <div className="flex gap-6 border-b border-outline-variant/15 pb-3">
                {authModes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMode(item);
                      setResetMode(false);
                      resetTransientState();
                    }}
                    className={`border-b-2 pb-3 font-mono text-[0.78rem] uppercase tracking-label transition-colors duration-100 ease-linear ${
                      mode === item
                        ? "border-primary text-primary"
                        : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : (
              <div className="border-b border-outline-variant/15 pb-3">
                <p className="font-mono text-[0.78rem] uppercase tracking-label text-primary">
                  PASSWORD RESET
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!resetMode && mode === "SIGN UP" && otpStep === "request" ? (
                <label className="space-y-3">
                  <span className="bf-label text-foreground">FULL NAME</span>
                  <input
                    value={formState.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="bf-terminal-input"
                    placeholder="Enter your full name"
                  />
                </label>
              ) : null}

              <label className="space-y-3">
                <span className="bf-label text-foreground">EMAIL</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="bf-terminal-input"
                  placeholder="name@company.com"
                />
              </label>

              {(!resetMode && mode === "LOGIN") ||
              (!resetMode && mode === "SIGN UP" && otpStep === "request") ||
              (resetMode && resetStep === "confirm") ? (
                <label className="space-y-3">
                  <span className="bf-label text-foreground">
                    {resetMode ? "NEW PASSWORD" : "PASSWORD"}
                  </span>
                  <input
                    type="password"
                    value={formState.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    className="bf-terminal-input"
                    placeholder={resetMode ? "Choose a new password" : "Enter your password"}
                  />
                </label>
              ) : null}

              {!resetMode && mode === "SIGN UP" && otpStep === "request" ? (
                <label className="space-y-3">
                  <span className="bf-label text-foreground">WALLET ADDRESS (OPTIONAL)</span>
                  <input
                    value={formState.walletAddress}
                    onChange={(event) => updateField("walletAddress", event.target.value)}
                    className="bf-terminal-input"
                    placeholder="0x..."
                  />
                </label>
              ) : null}

              {(!resetMode && otpStep === "verify") || (resetMode && resetStep === "confirm") ? (
                <label className="space-y-3">
                  <span className="bf-label text-foreground">
                    {resetMode ? "RESET OTP" : "EMAIL OTP"}
                  </span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={formState.otpCode}
                    onChange={(event) => updateField("otpCode", event.target.value)}
                    className="bf-terminal-input"
                    placeholder="Enter the code from your email"
                  />
                </label>
              ) : null}

              {showCaptcha ? (
                <div className="space-y-3">
                  <span className="bf-label text-foreground">CAPTCHA VERIFICATION</span>
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    onVerify={(token) => updateField("captchaToken", token)}
                  />
                </div>
              ) : null}

              {error ? <p className="text-sm text-error">{error}</p> : null}
              {notice ? <p className="text-sm text-primary">{notice}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="bf-button-primary w-full justify-center"
              >
                {isSubmitting
                  ? resetMode
                    ? resetStep === "request"
                      ? "SENDING RESET CODE..."
                      : "UPDATING PASSWORD..."
                    : mode === "SIGN UP"
                      ? otpStep === "verify"
                        ? "VERIFYING OTP..."
                        : "SIGNING UP..."
                      : "SIGNING IN..."
                  : resetMode
                    ? resetStep === "request"
                      ? "SEND RESET CODE"
                      : "UPDATE PASSWORD"
                    : mode === "SIGN UP"
                      ? otpStep === "verify"
                        ? "VERIFY OTP"
                        : "CREATE ACCOUNT"
                      : "SIGN IN"}
              </button>

              {!resetMode && mode === "SIGN UP" && otpStep === "verify" ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setOtpStep("request");
                    setFormState((current) => ({ ...current, otpCode: "", captchaToken: "" }));
                    resetTransientState();
                  }}
                  className="bf-button-secondary w-full justify-center"
                >
                  EDIT SIGN-UP DETAILS
                </button>
              ) : null}

              {resetMode && resetStep === "confirm" ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setResetStep("request");
                    setFormState((current) => ({
                      ...current,
                      otpCode: "",
                      password: "",
                      captchaToken: ""
                    }));
                    resetTransientState();
                  }}
                  className="bf-button-secondary w-full justify-center"
                >
                  REQUEST A NEW RESET CODE
                </button>
              ) : null}
            </form>

            <div className="flex flex-wrap gap-4 text-[0.72rem] uppercase tracking-label">
              {!resetMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setResetStep("request");
                    resetTransientState();
                  }}
                  className="font-mono text-primary"
                >
                  FORGOT PASSWORD?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setResetStep("request");
                    resetTransientState();
                  }}
                  className="font-mono text-primary"
                >
                  BACK TO LOGIN
                </button>
              )}
            </div>

            <p className="text-sm leading-7 text-muted">
              Public pages remain open. Protected routes include researcher submissions,
              dashboards, and owner admin tools.
            </p>

            {!hasSupabaseEnv() ? (
              <p className="text-sm leading-7 text-error">
                Add your Supabase project URL and publishable key in `.env.local` before using this
                page.
              </p>
            ) : null}

            <Link href="/" className="bf-button-tertiary">
              RETURN TO LANDING
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
