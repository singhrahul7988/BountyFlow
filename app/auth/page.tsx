import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Suspense
        fallback={
          <section className="bf-shell pt-32 pb-24">
            <div className="bg-surface-low p-8 md:p-10">
              <p className="bf-label text-primary">AUTHENTICATION</p>
              <p className="mt-4 text-sm leading-8 text-muted">Loading access controls...</p>
            </div>
          </section>
        }
      >
        <AuthPanel />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
