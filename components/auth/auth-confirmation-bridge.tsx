"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { useAppStore } from "@/lib/stores/app-store";

export function AuthConfirmationBridge() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
  const [status, setStatus] = useState<"processing" | "done" | "error">("processing");
  const [message, setMessage] = useState("Finalizing email confirmation...");
  const { signOut } = useAppStore();

  const targetHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("confirmed", "1");

    const role = searchParams.get("role");
    const next = searchParams.get("next");

    if (role === "owner" || role === "researcher") {
      params.set("role", role);
    }

    if (next) {
      params.set("next", next);
    }

    return `/auth?${params.toString()}`;
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function finalizeConfirmation() {
      if (!supabase) {
        if (!isMounted) {
          return;
        }

        setStatus("done");
        setMessage("Email confirmed. Continue to login.");
        router.replace(targetHref);
        return;
      }

      try {
        await supabase.auth.getSession();
        await supabase.auth.signOut();
        signOut();

        if (!isMounted) {
          return;
        }

        setStatus("done");
        setMessage("Email confirmed. Redirecting to login...");
        router.replace(targetHref);
      } catch {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setMessage("Email confirmation completed, but the app could not finish sign-out cleanly.");
      }
    }

    void finalizeConfirmation();

    return () => {
      isMounted = false;
    };
  }, [router, signOut, supabase, targetHref]);

  return (
    <section className="bf-shell pt-32 pb-24">
      <div className="max-w-3xl bg-surface-low p-8 md:p-10">
        <p className="bf-label text-primary">EMAIL CONFIRMATION</p>
        <h1 className="bf-display mt-5 text-[2.35rem] leading-none tracking-tightHeading sm:text-[3.2rem]">
          ACCOUNT
          <span className="block">VERIFICATION</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[1rem] leading-8 text-muted">{message}</p>

        {status === "error" ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={targetHref} className="bf-button-primary">
              CONTINUE TO LOGIN
            </Link>
            <Link href="/" className="bf-button-tertiary">
              RETURN TO LANDING
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
