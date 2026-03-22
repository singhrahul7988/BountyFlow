import { Suspense } from "react";

import { AuthConfirmationBridge } from "@/components/auth/auth-confirmation-bridge";
import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";

export default function AuthConfirmedPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Suspense
        fallback={
          <section className="bf-shell pt-32 pb-24">
            <div className="max-w-3xl bg-surface-low p-8 md:p-10">
              <p className="bf-label text-primary">EMAIL CONFIRMATION</p>
              <p className="mt-4 text-sm leading-8 text-muted">
                Finalizing email confirmation...
              </p>
            </div>
          </section>
        }
      >
        <AuthConfirmationBridge />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
