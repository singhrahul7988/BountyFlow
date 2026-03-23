"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { AIScoreDisplay } from "@/components/home/ai-score-display";
import { StatusChip } from "@/components/home/status-chip";
import { createRemoteDemoSubmission } from "@/lib/demo-api";
import type { AdminSubmission } from "@/lib/admin-submissions-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission, UploadedEvidenceFile } from "@/lib/dashboard-data";
import { MAX_EVIDENCE_FILES, scanEvidenceFile } from "@/lib/evidence-validation";
import type { AnalyzerMetric } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { toLocalEvidenceFile, uploadEvidenceFiles } from "@/lib/supabase/storage";
import { useAppStore } from "@/lib/stores/app-store";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";
import { formatCurrency } from "@/lib/utils";
import { SeveritySegment, type SeverityValue } from "./severity-segment";

type SubmissionFormState = {
  title: string;
  affectedComponent: string;
  severity: SeverityValue | "";
  description: string;
  stepsToReproduce: string;
  impactAssessment: string;
  githubUrl: string;
  references: string;
  files: File[];
  termsAccepted: boolean;
};

type FormErrors = Partial<Record<keyof SubmissionFormState | "evidence", string>>;

type SubmissionStep = 1 | 2 | 3;

function buildPreview(state: SubmissionFormState): {
  score: number;
  subScores: AnalyzerMetric[];
  reasoning: string;
  recommendedPct: number;
} {
  const severityBase: Record<SeverityValue, number> = {
    CRITICAL: 9.1,
    HIGH: 8.2,
    MEDIUM: 6.9,
    LOW: 5.7
  };

  const selectedSeverity = state.severity || "MEDIUM";
  const descriptionStrength = Math.min(state.description.length / 1600, 1);
  const stepsStrength = Math.min(state.stepsToReproduce.length / 700, 1);
  const impactStrength = Math.min(state.impactAssessment.length / 500, 1);
  const evidenceStrength = Math.min(
    (state.files.length * 0.2) + (state.githubUrl ? 0.2 : 0) + (state.references ? 0.15 : 0),
    1
  );

  const score = Number(
    Math.min(
      severityBase[selectedSeverity],
      4.8 +
        descriptionStrength * 1.6 +
        stepsStrength * 1.4 +
        impactStrength * 1.2 +
        evidenceStrength * 1.3
    ).toFixed(1)
  );

  const subScores = [
    {
      label: "REPRODUCIBILITY",
      value: Math.min(0.98, 0.42 + stepsStrength * 0.48 + evidenceStrength * 0.08)
    },
    {
      label: "IMPACT",
      value: Math.min(0.99, 0.4 + impactStrength * 0.5 + (selectedSeverity === "CRITICAL" ? 0.08 : 0))
    },
    {
      label: "NOVELTY",
      value: Math.min(0.92, 0.36 + descriptionStrength * 0.26 + evidenceStrength * 0.16)
    },
    {
      label: "COMPLETENESS",
      value: Math.min(0.95, 0.34 + descriptionStrength * 0.34 + stepsStrength * 0.2 + evidenceStrength * 0.1)
    },
    {
      label: "CVSS ALIGNMENT",
      value: Math.min(0.94, 0.38 + impactStrength * 0.32 + (selectedSeverity !== "LOW" ? 0.12 : 0))
    }
  ] satisfies AnalyzerMetric[];

  const recommendedPct = score >= 9 ? 100 : score >= 7.5 ? 80 : score >= 6 ? 60 : 40;
  const reasoning =
    `The report targets ${state.affectedComponent || "a scoped component"} with ${selectedSeverity.toLowerCase()} self-assessed impact. ` +
    `Reproduction detail is ${stepsStrength > 0.7 ? "strong" : "still developing"}, and the evidence package ` +
    `${evidenceStrength > 0.45 ? "looks actionable for review." : "needs more direct artifacts for a higher confidence score."}`;

  return { score, subScores, reasoning, recommendedPct };
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(size / 1024)} KB`;
}

const initialState: SubmissionFormState = {
  title: "",
  affectedComponent: "",
  severity: "",
  description: "",
  stepsToReproduce: "",
  impactAssessment: "",
  githubUrl: "",
  references: "",
  files: [],
  termsAccepted: false
};

export function SubmissionExperience({ bounty }: { bounty: BountyDetail }) {
  const [supabase] = useState(() => (hasSupabaseEnv() ? createClient() : null));
  const currentUser = useAppStore((state) => state.currentUser);
  const addDemoSubmission = useDemoDataStore((state) => state.addDemoSubmission);
  const [step, setStep] = useState<SubmissionStep>(1);
  const [state, setState] = useState<SubmissionFormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [hasAiResult, setHasAiResult] = useState(false);
  const [typedReasoning, setTypedReasoning] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const preview = useMemo(() => buildPreview(state), [state]);

  useEffect(() => {
    if (step !== 3) {
      setTypedReasoning("");
      return;
    }

    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setTypedReasoning(preview.reasoning.slice(0, index));
      if (index >= preview.reasoning.length) {
        window.clearInterval(interval);
      }
    }, 18);

    return () => window.clearInterval(interval);
  }, [preview.reasoning, step]);

  useEffect(() => {
    if (!isSubmitted) {
      return;
    }

    const timer = window.setTimeout(() => {
      setHasAiResult(true);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [isSubmitted]);

  function updateField<Key extends keyof SubmissionFormState>(key: Key, value: SubmissionFormState[Key]) {
    if (submitError) {
      setSubmitError("");
    }
    setState((currentState) => ({ ...currentState, [key]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      if (key === "files" || key === "githubUrl" || key === "references") {
        delete nextErrors.evidence;
      }
      return nextErrors;
    });
  }

  function validateStep(targetStep: SubmissionStep) {
    const nextErrors: FormErrors = {};

    if (targetStep === 1) {
      if (!state.title.trim()) nextErrors.title = "Vulnerability title is required.";
      if (!state.affectedComponent.trim()) nextErrors.affectedComponent = "Affected component is required.";
      if (!state.severity) nextErrors.severity = "Select a severity.";
      if (!state.description.trim()) nextErrors.description = "Description is required.";
      if (!state.stepsToReproduce.trim()) nextErrors.stepsToReproduce = "Reproduction steps are required.";
      if (!state.impactAssessment.trim()) nextErrors.impactAssessment = "Impact assessment is required.";
    }

    if (targetStep === 2) {
      if (!state.files.length && !state.githubUrl.trim() && !state.references.trim()) {
        nextErrors.evidence = "Add at least one evidence source before continuing.";
      }
    }

    if (targetStep === 3 && !state.termsAccepted) {
      nextErrors.termsAccepted = "You must accept the submission terms.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) {
      return;
    }

    if (step < 3) {
      setStep((currentStep) => (currentStep + 1) as SubmissionStep);
    }
  }

  function handleBack() {
    setStep((currentStep) => (currentStep > 1 ? ((currentStep - 1) as SubmissionStep) : currentStep));
  }

  async function handleIncomingFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const accepted: File[] = [];
    let validationError = "";
    const currentCount = state.files.length;

    for (const file of Array.from(fileList)) {
      if (currentCount + accepted.length >= MAX_EVIDENCE_FILES) {
        validationError = `You can attach up to ${MAX_EVIDENCE_FILES} evidence files.`;
        break;
      }

      const fileError = await scanEvidenceFile(file);

      if (fileError) {
        validationError = `${file.name}: ${fileError}`;
        break;
      }

      accepted.push(file);
    }

    if (validationError) {
      setErrors((currentErrors) => ({ ...currentErrors, evidence: validationError }));
    }

    if (accepted.length) {
      updateField("files", [...state.files, ...accepted]);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    if (isSaving) {
      return;
    }

    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    const adminId = `BF-${suffix}`;
    const researcherId = `sub-${suffix.toLowerCase()}`;
    let uploadedFiles: UploadedEvidenceFile[] = [];
    let uploadWarning = "";

    if (state.files.length) {
      if (supabase && currentUser?.id) {
        try {
          uploadedFiles = await uploadEvidenceFiles(supabase, state.files, {
            userId: currentUser.id,
            bountySlug: bounty.slug,
            submissionId: researcherId
          });
        } catch (error) {
          uploadedFiles = state.files.map((file) => toLocalEvidenceFile(file));
          uploadWarning =
            error instanceof Error
              ? `${error.message} File metadata will still be saved, but uploaded file links are unavailable.`
              : "Evidence upload failed. File metadata will still be saved, but uploaded links are unavailable.";
        }
      } else {
        uploadedFiles = state.files.map((file) => toLocalEvidenceFile(file));
        uploadWarning =
          "Supabase Storage is not ready for this session. File metadata will be saved without hosted links.";
      }
    }

    const submissionStatus: AdminSubmission["status"] =
      preview.score < 5 ? "REJECTED" : preview.score >= 9 ? "UNDER REVIEW" : "AI SCORED";
    const payoutAmount = Math.round(
      ((state.severity === "CRITICAL"
        ? bounty.rewardTiers.critical
        : state.severity === "HIGH"
          ? bounty.rewardTiers.high
          : state.severity === "MEDIUM"
            ? bounty.rewardTiers.medium
            : bounty.rewardTiers.low) *
        preview.recommendedPct) /
        100
    );

    const researcherSubmission: ResearcherSubmission = {
      id: researcherId,
      bountySlug: bounty.slug,
      bountyName: bounty.title,
      title: state.title,
      submittedAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC"
      }).replace(",", " |") + " UTC",
      aiScore: preview.score,
      status:
        preview.score < 5 ? "REJECTED" : preview.score >= 9 ? "UNDER REVIEW" : "AI SCORED",
      payout: payoutAmount,
      severity: (state.severity || "MEDIUM") as ResearcherSubmission["severity"],
      responseEta: preview.score < 5 ? "CLOSED" : preview.score >= 9 ? "ETA 4H" : "ETA 12H",
      description: state.description,
      stepsToReproduce: state.stepsToReproduce
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean),
      impactAssessment: state.impactAssessment,
      evidence: {
        codeFiles: state.files.length,
        screenshots: state.files.filter((file) => file.type.startsWith("image/")).length,
        githubUrl: state.githubUrl || undefined,
        references: state.references
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        uploadedFiles
      }
    };

    const adminSubmission: AdminSubmission = {
      id: adminId,
      bountySlug: bounty.slug,
      bountyName: bounty.title,
      severity: (state.severity || "MEDIUM") as AdminSubmission["severity"],
      title: state.title,
      reporterName: currentUser?.name || "Researcher",
      reporterAddress: currentUser?.walletAddress || "0x71C03901BF0001",
      reporterReputation: 7.8,
      submittedAt: researcherSubmission.submittedAt,
      aiScore: preview.score,
      status: submissionStatus,
      recommendedPct: preview.recommendedPct,
      tierReward:
        state.severity === "CRITICAL"
          ? bounty.rewardTiers.critical
          : state.severity === "HIGH"
            ? bounty.rewardTiers.high
            : state.severity === "MEDIUM"
              ? bounty.rewardTiers.medium
              : bounty.rewardTiers.low,
      summaryRisk: state.impactAssessment.slice(0, 120),
      subScores: preview.subScores.map((item) => ({
        label: item.label.replace("REPRODUCIBILITY", "REPRO").replace("IMPACT SCORE", "IMPACT"),
        value: item.value
      })),
      evidencePills: [
        state.files.length ? `${state.files.length} FILES` : "",
        state.githubUrl ? "GITHUB LINK" : "",
        state.references ? "REFERENCES" : ""
      ].filter(Boolean),
      description: state.description,
      stepsToReproduce: researcherSubmission.stepsToReproduce,
      impactAssessment: state.impactAssessment,
      codeSnippet: state.description.slice(0, 220) || "// Evidence snippet pending",
      screenshots: state.files
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => file.name),
      uploadedFiles,
      github: {
        url: state.githubUrl || "https://github.com/example/demo-report",
        repo: state.githubUrl
          ? state.githubUrl.replace("https://github.com/", "")
          : "example/demo-report",
        branch: "main",
        updatedAt: "JUST NOW"
      }
    };

    setIsSaving(true);
    setSubmitError("");

    try {
      const persisted = await createRemoteDemoSubmission({ researcherSubmission, adminSubmission });
      addDemoSubmission({
        researcherSubmission: persisted.researcherSubmission,
        adminSubmission: persisted.adminSubmission
      });
      if (uploadWarning) {
        setSubmitError(uploadWarning);
      }
    } catch (error) {
      addDemoSubmission({ researcherSubmission, adminSubmission });
      setSubmitError(
        error instanceof Error
          ? `${error.message} Saved locally for the current demo session only.`
          : "Remote persistence failed. Saved locally for the current demo session only."
      );
      if (uploadWarning) {
        setSubmitError((current) => `${current ? `${current} ` : ""}${uploadWarning}`.trim());
      }
    }

    setSubmissionId(adminId);
    setIsSubmitted(true);
    setHasAiResult(false);
    setIsSaving(false);
  }

  if (isSubmitted) {
    return (
      <section className="bf-shell pt-32 pb-24">
        <div className="grid gap-8 xl:grid-cols-[1fr_0.42fr]">
          <div className="space-y-6 bg-surface-low p-8 md:p-10">
            <p className="bf-label text-primary">SUBMISSION RECEIVED</p>
            <h1 className="bf-display text-[2.5rem] leading-none tracking-tightHeading sm:text-[3.8rem]">
              FINDING IN
              <span className="block">AI SCORING</span>
            </h1>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-surface-high p-5">
                <p className="bf-label">SUBMISSION ID</p>
                <p className="bf-data mt-3 text-[1.2rem] text-primary">{submissionId}</p>
              </div>
              <div className="bg-surface-high p-5">
                <p className="bf-label">STATUS</p>
                <div className="mt-3">
                  <StatusChip status="AI SCORING" pulsing />
                </div>
              </div>
            </div>
            <p className="max-w-3xl text-[1rem] leading-8 text-muted">
              Your report for {bounty.title} is now queued for autonomous scoring. The preview
              below simulates the score and reasoning that the researcher should see within
              roughly 30 seconds.
            </p>
            {submitError ? <p className="text-sm leading-7 text-amber">{submitError}</p> : null}
            <div className="flex flex-wrap gap-4">
              <Link href={`/bounty/${bounty.slug}`} className="bf-button-secondary">
                BACK TO BOUNTY
              </Link>
              <Link href="/dashboard" className="bf-button-primary">
                GO TO DASHBOARD
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-low p-6">
              {hasAiResult ? (
                <AIScoreDisplay
                  key={submissionId}
                  score={preview.score}
                  subScores={preview.subScores}
                  reasoning={preview.reasoning}
                  recommendedPct={preview.recommendedPct}
                  animate
                  title="AI SCORE PREVIEW"
                  subtitle="AUTONOMOUS TRIAGE COMPLETE"
                />
              ) : (
                <div className="space-y-5">
                  <span className="bf-label text-primary">AI SCORE PREVIEW</span>
                  <div className="flex items-end gap-3">
                    <span className="bf-data text-6xl text-muted">--</span>
                    <span className="bf-data text-2xl text-muted">/ 10</span>
                  </div>
                  <p className="text-sm leading-8 text-muted">
                    AI evaluation running. Reasoning and composite score will render here after the
                    scoring pipeline completes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bf-shell pt-32 pb-24">
      <div className="grid gap-8 xl:grid-cols-[0.6fr_0.4fr]">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              {[
                { index: 1 as SubmissionStep, label: "DETAILS" },
                { index: 2 as SubmissionStep, label: "EVIDENCE" },
                { index: 3 as SubmissionStep, label: "REVIEW" }
              ].map((item, itemIndex) => {
                const isActive = step === item.index;
                const isComplete = step > item.index;
                return (
                  <div key={item.label} className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.index < step) {
                          setStep(item.index);
                          return;
                        }

                        if (item.index === step + 1 && validateStep(step)) {
                          setStep(item.index);
                        }
                      }}
                      className="flex items-center gap-3"
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center border text-[0.85rem] font-mono ${
                          isActive
                            ? "border-primary text-primary"
                            : isComplete
                              ? "border-outline/20 text-muted"
                              : "border-outline-variant/20 text-muted"
                        }`}
                      >
                        {isComplete ? "OK" : item.index}
                      </span>
                      <span
                        className={`font-mono text-[0.82rem] uppercase tracking-label ${
                          isActive ? "text-primary" : "text-muted"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                    {itemIndex < 2 ? <span className="hidden h-px w-20 bg-outline-variant/20 md:block" /> : null}
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <p className="bf-label text-primary">SEC-AUDIT-ID: B-9920-X</p>
              <h1 className="bf-display text-[2.4rem] leading-none tracking-tightHeading sm:text-[4rem]">
                SUBMIT
                <span className="block">VULNERABILITY</span>
              </h1>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="title" className="bf-label text-foreground">
                    FINDING TITLE
                  </label>
                  <span className="bf-label">{state.title.length}/100</span>
                </div>
                <input
                  id="title"
                  maxLength={100}
                  value={state.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="e.g. Reentrancy in Bridge Withdrawal Logic"
                  className="bf-terminal-input"
                />
                {errors.title ? <p role="alert" aria-live="polite" className="text-sm text-error">{errors.title}</p> : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="component" className="bf-label text-foreground">
                  AFFECTED COMPONENT
                </label>
                <input
                  id="component"
                  value={state.affectedComponent}
                  onChange={(event) => updateField("affectedComponent", event.target.value)}
                  placeholder="Contract, function, module, or address"
                  className="bf-terminal-input"
                />
                {errors.affectedComponent ? <p role="alert" aria-live="polite" className="text-sm text-error">{errors.affectedComponent}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="bf-label text-foreground">REPORTED SEVERITY</label>
                <SeveritySegment value={state.severity} onChange={(value) => updateField("severity", value)} />
                {errors.severity ? <p role="alert" aria-live="polite" className="text-sm text-error">{errors.severity}</p> : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="description" className="bf-label text-foreground">
                    VULNERABILITY DESCRIPTION
                  </label>
                  <span className="bf-label">{state.description.length}/2000</span>
                </div>
                <textarea
                  id="description"
                  minLength={1}
                  maxLength={2000}
                  value={state.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className="bf-terminal-input min-h-[160px] resize-y"
                  placeholder="Detailed technical breakdown..."
                />
                {errors.description ? <p role="alert" aria-live="polite" className="text-sm text-error">{errors.description}</p> : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="steps" className="bf-label text-foreground">
                  STEPS TO REPRODUCE
                </label>
                <textarea
                  id="steps"
                  value={state.stepsToReproduce}
                  onChange={(event) => updateField("stepsToReproduce", event.target.value)}
                  className="bf-terminal-input min-h-[120px] resize-y"
                  placeholder="1. Deploy mock contract... 2. Call withdraw()..."
                />
                {errors.stepsToReproduce ? <p role="alert" aria-live="polite" className="text-sm text-error">{errors.stepsToReproduce}</p> : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="impact" className="bf-label text-foreground">
                  IMPACT ASSESSMENT
                </label>
                <textarea
                  id="impact"
                  value={state.impactAssessment}
                  onChange={(event) => updateField("impactAssessment", event.target.value)}
                  className="bf-terminal-input min-h-[100px] resize-y"
                  placeholder="Explain fund risk, blast radius, and likely exploit value."
                />
                {errors.impactAssessment ? <p role="alert" aria-live="polite" className="text-sm text-error">{errors.impactAssessment}</p> : null}
              </div>

              <button type="button" onClick={handleNext} className="bf-button-primary w-full justify-center">
                NEXT: ADD EVIDENCE
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="bf-label text-foreground">UPLOAD EVIDENCE</label>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => handleIncomingFiles(event.target.files)}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragActive(false);
                    handleIncomingFiles(event.dataTransfer.files);
                  }}
                  className={`flex min-h-[180px] w-full flex-col items-center justify-center gap-3 border border-dashed px-6 py-8 text-center transition-colors duration-100 ease-linear ${
                    isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-outline/30 bg-surface-low hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <svg viewBox="0 0 32 32" className="h-8 w-8 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M16 5V22" />
                    <path d="M10 11L16 5L22 11" />
                    <path d="M6 24H26V27H6z" />
                  </svg>
                  <span className="bf-label text-foreground">DRAG AND DROP FILES</span>
                  <span className="bf-label">OR CLICK TO BROWSE</span>
                  <span className="text-sm leading-7 text-muted">
                    Screenshots | Code files | PDFs | Videos | ZIPs | 50MB max per file
                  </span>
                </button>
                {errors.evidence ? <p role="alert" aria-live="polite" className="text-sm text-error">{errors.evidence}</p> : null}
              </div>

              {state.files.length ? (
                <div className="space-y-3">
                  {state.files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-4 bg-surface-low px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{file.name}</p>
                        <p className="bf-label">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "files",
                            state.files.filter((_, fileIndex) => fileIndex !== index)
                          )
                        }
                        className="bf-button-secondary px-3 py-2"
                      >
                        REMOVE
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="github" className="bf-label text-foreground">
                  GITHUB / POC URL
                </label>
                <input
                  id="github"
                  value={state.githubUrl}
                  onChange={(event) => updateField("githubUrl", event.target.value)}
                  className="bf-terminal-input"
                  placeholder="https://github.com/... or PoC link"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="references" className="bf-label text-foreground">
                  REFERENCES
                </label>
                <input
                  id="references"
                  value={state.references}
                  onChange={(event) => updateField("references", event.target.value)}
                  className="bf-terminal-input"
                  placeholder="CVEs, similar findings, or supporting references"
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button type="button" onClick={handleBack} className="bf-button-secondary justify-center sm:w-[12rem]">
                  BACK
                </button>
                <button type="button" onClick={handleNext} className="bf-button-primary flex-1 justify-center">
                  NEXT: REVIEW
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <div className="bg-surface-high p-6 md:p-7">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="bf-label">TITLE</p>
                      <p className="mt-2 text-sm leading-7 text-foreground">{state.title}</p>
                    </div>
                    <div>
                      <p className="bf-label">AFFECTED COMPONENT</p>
                      <p className="mt-2 text-sm leading-7 text-foreground">{state.affectedComponent}</p>
                    </div>
                    <div>
                      <p className="bf-label">SEVERITY</p>
                      <div className="mt-2">
                        <StatusChip status={state.severity || "LOW"} />
                      </div>
                    </div>
                    <div>
                      <p className="bf-label">EVIDENCE FILES</p>
                      <p className="mt-2 text-sm leading-7 text-foreground">{state.files.length} ATTACHED</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="bf-label">DESCRIPTION</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{state.description}</p>
                    </div>
                    <div>
                      <p className="bf-label">REPRODUCTION STEPS</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{state.stepsToReproduce}</p>
                    </div>
                    <div>
                      <p className="bf-label">IMPACT</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{state.impactAssessment}</p>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 bg-surface-low p-4">
                <input
                  type="checkbox"
                  checked={state.termsAccepted}
                  onChange={(event) => updateField("termsAccepted", event.target.checked)}
                  className="mt-1 h-[14px] w-[14px] accent-[var(--primary-container)]"
                />
                <span className="text-sm leading-7 text-muted">
                  I confirm this report is original, submitted in good faith, and follows the
                  program disclosure rules.
                </span>
              </label>
              {errors.termsAccepted ? <p role="alert" aria-live="polite" className="text-sm text-error">{errors.termsAccepted}</p> : null}

              <div className="flex flex-col gap-4 sm:flex-row">
                <button type="button" onClick={handleBack} className="bf-button-secondary justify-center sm:w-[12rem]">
                  BACK
                </button>
                <button type="submit" className="bf-button-primary flex-1 justify-center">
                  {isSaving ? "SUBMITTING..." : "SUBMIT FINDING - TRIGGER AI EVALUATION"}
                </button>
              </div>
              <p className="text-sm leading-7 text-muted">
                AI evaluation begins immediately after submit. Expect score and reasoning in
                approximately 30 seconds.
              </p>
            </div>
          ) : null}
        </form>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <div className="space-y-5 bg-surface-low p-6">
            <p className="bf-label">SUBMITTING TO</p>
            <h2 className="bf-display text-[1.6rem] leading-none tracking-tightHeading">{bounty.title}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip status="ACTIVE" />
              <StatusChip status="ESCROW VERIFIED" />
            </div>
            <div className="space-y-2">
              <p className="bf-label">REWARD POOL</p>
              <p className="bf-data text-[2.2rem] text-primary">{formatCurrency(bounty.rewardPool, 0)} USDT</p>
            </div>
            <div className="space-y-3">
              {[
                ["CRITICAL", bounty.rewardTiers.critical],
                ["HIGH", bounty.rewardTiers.high],
                ["MEDIUM", bounty.rewardTiers.medium],
                ["LOW", bounty.rewardTiers.low]
              ].map(([label, amount]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="bf-label text-foreground">{label}</span>
                  <span className="bf-data text-[0.9rem] text-primary">{formatCurrency(Number(amount), 0)}</span>
                </div>
              ))}
            </div>
            <Link href={`/bounty/${bounty.slug}`} className="bf-button-tertiary">
              VIEW BOUNTY DETAILS
            </Link>
          </div>

          <div className="bg-surface-low p-6">
            {step === 3 ? (
              <AIScoreDisplay
                key={`${step}-${state.severity}-${state.title.length}-${state.files.length}`}
                score={preview.score}
                subScores={preview.subScores}
                reasoning={typedReasoning || preview.reasoning}
                recommendedPct={preview.recommendedPct}
                animate
                title="AI SCORE PREVIEW"
                subtitle="UPDATES AS YOU FILL THE FORM"
              />
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <span className="bf-label text-primary">AI SCORE PREVIEW</span>
                    <p className="bf-label">UPDATES AS YOU FILL THE FORM</p>
                  </div>
                  <span className="h-2 w-2 animate-pulse-dot bg-indigo" />
                </div>

                <div className="flex items-end gap-3">
                  <span className="bf-data text-6xl text-muted">--</span>
                  <span className="bf-data text-2xl text-muted">/ 10</span>
                </div>

                <div className="space-y-4">
                  {["REPRODUCIBILITY", "IMPACT", "NOVELTY", "COMPLETENESS", "CVSS"].map((label) => (
                    <div key={label} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="bf-label text-foreground">{label}</span>
                        <span className="bf-label">--</span>
                      </div>
                      <div className="h-[6px] bg-background" />
                    </div>
                  ))}
                </div>

                <div className="bg-background p-5">
                  <p className="text-sm leading-8 text-muted">
                    Score reveal, sub-score bars, and the AI reasoning block activate on the
                    review step.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
