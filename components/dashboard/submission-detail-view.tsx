import Link from "next/link";

import type { ResearcherSubmission } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/utils";
import { StatusChip } from "../home/status-chip";

function scoreTone(score: number) {
  if (score >= 8) {
    return "text-primary";
  }

  if (score >= 6) {
    return "text-amber";
  }

  if (score >= 4) {
    return "text-indigo";
  }

  return "text-muted";
}

export function SubmissionDetailView({ submission }: { submission: ResearcherSubmission }) {
  return (
    <section className="bf-shell pt-32 pb-24">
      <div className="space-y-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <Link href="/dashboard" className="bf-button-tertiary">
              BACK TO DASHBOARD
            </Link>
            <p className="bf-label text-primary">{submission.id.toUpperCase()}</p>
            <h1 className="bf-display text-[2.5rem] leading-none tracking-tightHeading sm:text-[3.8rem]">
              {submission.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip status={submission.status} />
              <StatusChip status={submission.severity} />
              <span className="bf-label text-foreground">{submission.bountyName}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-surface-high p-5">
              <p className="bf-label">AI SCORE</p>
              <p className={`bf-data mt-3 text-[1.8rem] ${scoreTone(submission.aiScore)}`}>
                {submission.aiScore > 0 ? submission.aiScore.toFixed(1) : "--"}
              </p>
            </div>
            <div className="bg-surface-high p-5">
              <p className="bf-label">PAYOUT</p>
              <p className="bf-data mt-3 text-[1.2rem] text-primary">
                {submission.payout > 0 ? `${formatCurrency(submission.payout, 0)} USDT` : "--"}
              </p>
            </div>
            <div className="bg-surface-high p-5">
              <p className="bf-label">SUBMITTED</p>
              <p className="bf-data mt-3 text-[0.86rem] text-muted">{submission.submittedAt}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.68fr_0.32fr]">
          <div className="space-y-6">
            <div className="bg-surface-low p-6 md:p-7">
              <p className="bf-label">DESCRIPTION</p>
              <p className="mt-4 text-sm leading-8 text-muted">{submission.description}</p>
            </div>

            <div className="bg-surface-low p-6 md:p-7">
              <p className="bf-label">STEPS TO REPRODUCE</p>
              <ol className="mt-4 space-y-3 font-mono text-sm leading-8 text-muted">
                {submission.stepsToReproduce.map((step, index) => (
                  <li key={step}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-surface-low p-6 md:p-7">
              <p className="bf-label">IMPACT ASSESSMENT</p>
              <p className="mt-4 text-sm leading-8 text-muted">{submission.impactAssessment}</p>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="bg-surface-low p-6">
              <p className="bf-label">EVIDENCE PACKAGE</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">CODE FILES</span>
                  <span className="bf-data text-[0.9rem] text-primary">
                    {submission.evidence.codeFiles}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">SCREENSHOTS</span>
                  <span className="bf-data text-[0.9rem] text-primary">
                    {submission.evidence.screenshots}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">REFERENCES</span>
                  <span className="bf-data text-[0.9rem] text-primary">
                    {submission.evidence.references.length}
                  </span>
                </div>
              </div>
              {submission.evidence.githubUrl ? (
                <Link
                  href={submission.evidence.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bf-button-tertiary mt-5"
                >
                  VIEW GITHUB POC
                </Link>
              ) : null}
            </div>

            {submission.txHash ? (
              <div className="bg-surface-low p-6">
                <p className="bf-label">ON-CHAIN RECEIPT</p>
                <p className="bf-data mt-4 text-[0.86rem] text-primary">{submission.txHash}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
