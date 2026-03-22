"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getDefaultRouteForRole,
  type UserRole
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getAuthUserFromProfile } from "@/lib/supabase/profiles";
import { useAppStore } from "@/lib/stores/app-store";

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

const AUTH_TIMEOUT_MS = 15000;

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
    normalized.includes("password should be at least 6 characters") ||
    normalized.includes("password should contain at least one character of each")
  ) {
    return "Password must be at least 6 characters and include a number.";
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

  if (normalized.includes("otp")) {
    return `OTP delivery failed. ${message}`;
  }

  return message;
}

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, hasHydrated, signIn, signOut } = useAppStore();
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
  const [mode, setMode] = useState<(typeof authModes)[number]>("LOGIN");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [role, setRole] = useState<UserRole>(
    searchParams.get("role") === "owner" ? "owner" : "researcher"
  );
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    otpCode: "",
    walletAddress: ""
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get("next");
  const confirmed = searchParams.get("confirmed");

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

    if (reason === "role") {
      return "That route is restricted to a different account type. Sign in with the correct role to continue.";
    }

    if (reason === "auth") {
      return "Sign in to access protected researcher and owner routes.";
    }

    return "Authenticate with the role that matches the area of the platform you need to access.";
  }, [searchParams]);

  async function verifyOwnerAccess(email: string) {
    const response = await fetch("/api/auth/owner-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error("Unable to verify owner access right now.");
    }

    const data = (await response.json()) as { allowed?: boolean };
    return Boolean(data.allowed);
  }

  function updateField(key: keyof typeof formState, value: string) {
    setFormState((current) => ({ ...current, [key]: value }));
    setError("");
    setNotice("");
  }

  useEffect(() => {
    setOtpStep("request");
    setFormState((current) => ({ ...current, otpCode: "" }));
    setError("");
    setNotice("");
  }, [mode, role]);

  async function finalizeAuthenticatedUser(user: User | null) {
    if (!supabase) {
      return;
    }

    const mapped = await withTimeout(
      getAuthUserFromProfile(supabase, user),
      "Profile lookup timed out after OTP verification. Try again."
    );

    if (!mapped) {
      setError("Your account is missing a BountyFlow profile. Run the Supabase profile SQL setup first.");
      await supabase.auth.signOut();
      signOut();
      return;
    }

    if (mapped.role !== role) {
      setError(`This account is registered as ${mapped.role}, not ${role}.`);
      await supabase.auth.signOut();
      signOut();
      return;
    }

    signIn(mapped);
    router.push(nextPath || getDefaultRouteForRole(mapped.role));
    router.refresh();
  }

  async function completeSignupVerification(user: User | null) {
    if (!supabase) {
      return;
    }

    const mapped = await withTimeout(
      getAuthUserFromProfile(supabase, user),
      "Profile lookup timed out after verification. Try signing in."
    );

    if (!mapped) {
      setError("Email verified, but the BountyFlow profile is missing. Check the Supabase profile trigger.");
      await supabase.auth.signOut();
      signOut();
      return;
    }

    await supabase.auth.signOut();
    signOut();
    setMode("LOGIN");
    setOtpStep("request");
    setFormState({
      name: "",
      email: "",
      password: "",
      otpCode: "",
      walletAddress: ""
    });
    setNotice("Email verified. You can now sign in with your email and password.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase environment variables are not configured yet.");
      return;
    }

    if (!formState.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (otpStep === "request" && mode === "SIGN UP" && !formState.name.trim()) {
      setError("Name is required for sign up.");
      return;
    }

    if (otpStep === "verify" && !formState.otpCode.trim()) {
      setError("Enter the OTP sent to your email.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
    if (!formState.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (mode === "LOGIN" && !formState.password.trim()) {
      setError("Password is required.");
      return;
    }

    if (otpStep === "request" && mode === "SIGN UP" && !formState.name.trim()) {
      setError("Name is required for sign up.");
      return;
    }

    if (otpStep === "request" && mode === "SIGN UP" && !formState.password.trim()) {
      setError("Password is required for sign up.");
      return;
    }

    if (otpStep === "request" && role === "owner" && mode === "SIGN UP") {
        const isAllowed = await withTimeout(
          verifyOwnerAccess(formState.email.trim()),
          "Owner access verification timed out. Try again."
        );

        if (!isAllowed) {
          setError("This email is not approved for project owner access.");
          return;
        }
      }

      if (mode === "SIGN UP" && otpStep === "request") {
        const { error: signUpError } = await withTimeout(
          supabase.auth.signUp({
            email: formState.email.trim(),
            password: formState.password,
            options: {
              data: {
                role,
                name: formState.name.trim(),
                walletAddress: formState.walletAddress.trim()
              }
            }
          }),
          "Sign up timed out. Check your connection and try again."
        );

        if (signUpError) {
          setError(formatAuthErrorMessage(signUpError.message));
          return;
        }

        setOtpStep("verify");
        setNotice(
          `Verification code sent to ${formState.email.trim()}. Enter the OTP to verify your email.`
        );
        return;
      }

      if (mode === "SIGN UP" && otpStep === "verify") {
        const { data, error: verifyError } = await withTimeout(
          supabase.auth.verifyOtp({
            email: formState.email.trim(),
            token: formState.otpCode.trim(),
            type: "email"
          }),
          "OTP verification timed out while verifying your email."
        );

        if (verifyError) {
          setError(verifyError.message);
          return;
        }

        await completeSignupVerification(data.user);
        return;
      }

      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: formState.email.trim(),
          password: formState.password
        }),
        "Sign in timed out. Check your connection and try again."
      );

      if (signInError) {
        setError(formatAuthErrorMessage(signInError.message));
        return;
      }

      await finalizeAuthenticatedUser(data.user);
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

  return (
    <section className="bf-shell pt-32 pb-24">
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
                className={`space-y-4 p-5 text-left transition-colors duration-100 ease-linear ${
                  role === item.value ? "bg-surface-high" : "bg-background hover:bg-surface-high"
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
          <div className="flex gap-6 border-b border-outline-variant/15 pb-3">
            {authModes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError("");
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "SIGN UP" && otpStep === "request" ? (
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

            {mode === "LOGIN" || (mode === "SIGN UP" && otpStep === "request") ? (
              <label className="space-y-3">
                <span className="bf-label text-foreground">PASSWORD</span>
                <input
                  type="password"
                  value={formState.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="bf-terminal-input"
                  placeholder="Enter your password"
                />
              </label>
            ) : null}

            {mode === "SIGN UP" && otpStep === "request" ? (
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

            {otpStep === "verify" ? (
              <label className="space-y-3">
                <span className="bf-label text-foreground">EMAIL OTP</span>
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

            {error ? <p className="text-sm text-error">{error}</p> : null}
            {notice ? <p className="text-sm text-primary">{notice}</p> : null}

            <button type="submit" disabled={isSubmitting} className="bf-button-primary w-full justify-center">
              {isSubmitting
                ? mode === "SIGN UP"
                  ? otpStep === "verify"
                    ? "VERIFYING OTP..."
                    : "SIGNING UP..."
                  : "SIGNING IN..."
                : mode === "SIGN UP"
                  ? otpStep === "verify"
                    ? "VERIFY OTP"
                    : "CREATE ACCOUNT"
                  : "SIGN IN"}
            </button>

            {mode === "SIGN UP" && otpStep === "verify" ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setOtpStep("request");
                  setFormState((current) => ({ ...current, otpCode: "" }));
                  setError("");
                  setNotice("");
                }}
                className="bf-button-secondary w-full justify-center"
              >
                EDIT SIGN-UP DETAILS
              </button>
            ) : null}
          </form>

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
    </section>
  );
}
