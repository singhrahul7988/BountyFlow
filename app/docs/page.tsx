import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";

const stackItems = [
  "Next.js 14 App Router",
  "Tailwind CSS + CSS Modules",
  "Supabase Auth + profiles table",
  "Supabase-backed demo bounty + submission persistence",
  "Supabase Storage evidence uploads",
  "Supabase-backed treasury + owner notifications",
  "Wagmi/Viem wallet linking with SIWE-style signature verification",
  "WDK live-mode treasury adapter with mock fallback",
  "Zustand local fallback + sync layer",
  "React Query",
  "Gemini-backed exploit analysis demo route"
];

const featureHighlights = [
  "Public landing page with live treasury hero, active listings, AI triage demo, and dedicated leaderboard view.",
  "Role-based authentication for researchers and project owners with Supabase-backed profiles.",
  "Public active bounties explorer with filters, compact program cards, and gated bounty actions through auth.",
  "Researcher dashboard with submission tracking, payout history, reputation metrics, and leaderboard preview.",
  "Project owner flow for bounty creation, submission review, treasury visibility, and dispute management.",
  "Gemini-backed exploit analysis route that scores payloads and returns AI triage output in the demo analyzer.",
  "Wallet linking with SIWE-style signature flow for authenticated users.",
  "Supabase-backed demo persistence for bounties, submissions, profiles, and uploaded evidence."
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="bf-shell pt-24 pb-18">
        <div className="mx-auto w-full max-w-[1420px]">
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

          <div className="mt-10">
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
                <p className="bf-label text-primary">FEATURES</p>
                <ol className="mt-5 space-y-3 font-mono text-[0.85rem] leading-8 text-muted">
                  {featureHighlights.map((step, index) => (
                    <li key={step}>
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
