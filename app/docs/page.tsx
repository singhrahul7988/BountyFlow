import Link from "next/link";

import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";

const stackItems = [
  "Next.js 14 App Router",
  "Tailwind CSS + CSS Modules",
  "Supabase Auth + profiles table",
  "Supabase-backed demo bounty + submission persistence",
  "Supabase Storage evidence uploads",
  "Zustand local fallback + sync layer",
  "React Query",
  "Gemini-backed exploit analysis demo route"
];

const demoFlow = [
  "Owner signs in and opens /admin/create to configure and launch a bounty.",
  "Launched bounties appear on /bounties and resolve to public detail pages.",
  "Researcher signs in, opens a bounty, and submits a report through the 3-step flow.",
  "Submission instantly appears in the owner queue and owner notifications inbox.",
  "Owner reviews the report in /admin/submissions or /admin/submissions/[id].",
  "Owner decisions propagate back to the researcher dashboard and submission detail route."
];

const setupSteps = [
  "Create .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and OWNER_ALLOWED_EMAILS.",
  "Run the SQL in supabase/profiles.sql inside the Supabase SQL Editor.",
  "Run the SQL in supabase/demo_persistence.sql so owner-created bounties and researcher submissions persist across sessions.",
  "Run the SQL in supabase/storage_evidence.sql to create the public evidence bucket and upload policies.",
  "Enable email/password auth in Supabase and set the redirect URL to /auth/confirmed.",
  "Run npm install, then npm run dev or npm run build:clean."
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="bf-shell pt-24 pb-18">
        <div className="grid gap-8 xl:grid-cols-[1fr_0.72fr] xl:items-end">
          <div className="space-y-4">
            <p className="bf-label text-primary">PROJECT DOCUMENTATION</p>
            <h1 className="bf-display text-[2rem] leading-none tracking-tightHeading sm:text-[3rem]">
              DEMO
              <span className="block bg-primary-gradient bg-clip-text text-transparent">
                RUNBOOK
              </span>
            </h1>
          </div>

          <p className="max-w-2xl justify-self-end text-[0.86rem] leading-7 text-muted">
            This docs surface summarizes the current BountyFlow demo, setup requirements, and the
            end-to-end paths that are working today.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[0.68fr_0.32fr]">
          <div className="space-y-6">
            <section className="bg-surface-low p-6 md:p-8">
              <p className="bf-label text-primary">WHAT IS WORKING</p>
              <div className="mt-5 space-y-5">
                <p className="text-[0.95rem] leading-8 text-muted">
                  BountyFlow currently supports public bounty browsing, protected researcher and
                  owner dashboards, submission intake, owner review, Supabase-backed persisted
                  demo bounty and submission flows, uploaded evidence artifacts, and role-based auth.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {stackItems.map((item) => (
                    <div key={item} className="bg-background p-4">
                      <p className="bf-label text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-surface-low p-6 md:p-8">
              <p className="bf-label text-primary">HACKATHON DEMO FLOW</p>
              <ol className="mt-5 space-y-3 font-mono text-[0.85rem] leading-8 text-muted">
                {demoFlow.map((step, index) => (
                  <li key={step}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </section>

            <section className="bg-surface-low p-6 md:p-8">
              <p className="bf-label text-primary">LOCAL SETUP</p>
              <ol className="mt-5 space-y-3 font-mono text-[0.85rem] leading-8 text-muted">
                {setupSteps.map((step, index) => (
                  <li key={step}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28">
            <section className="bg-surface-low p-6">
              <p className="bf-label text-primary">KEY ROUTES</p>
              <div className="mt-5 space-y-3">
                {[
                  ["/", "Landing"],
                  ["/bounties", "Public bounty index"],
                  ["/bounty/[slug]", "Public bounty detail"],
                  ["/bounty/[slug]/submit", "Researcher submission flow"],
                  ["/dashboard", "Researcher dashboard"],
                  ["/admin", "Owner dashboard"],
                  ["/admin/submissions", "Owner queue"],
                  ["/admin/create", "Create bounty"],
                  ["/admin/notifications", "Owner inbox"],
                  ["/admin/settings", "Owner settings"]
                ].map(([path, label]) => (
                  <div key={path} className="bg-background p-4">
                    <p className="bf-data text-[0.82rem] text-primary">{path}</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface-low p-6">
              <p className="bf-label text-primary">PROJECT FILES</p>
              <div className="mt-5 flex flex-col gap-3">
                <Link href="/leaderboard" className="bf-button-tertiary">
                  OPEN LEADERBOARD
                </Link>
                <Link href="/auth" className="bf-button-secondary">
                  OPEN AUTH
                </Link>
                <Link href="/bounties" className="bf-button-primary">
                  BROWSE BOUNTIES
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
