import type {
  AdminSubmission,
  AdminSubmissionSeverity,
  AdminSubmissionStatus
} from "@/lib/admin-submissions-data";
import type {
  AcceptedSeverity,
  BountyActivity,
  BountyDetail,
  RewardTiers
} from "@/lib/bounty-data";
import type { ResearcherSubmission, UploadedEvidenceFile } from "@/lib/dashboard-data";
import type { SubmissionDecision, SubmissionDisputeNote } from "@/lib/demo-types";
import {
  MAX_EVIDENCE_FILES,
  validateUploadedEvidenceRecord
} from "@/lib/evidence-validation";

import { buildValidationErrorResponse } from "./api-errors";
import {
  isPlainObject,
  readEnum,
  readEnumArray,
  readObject,
  readOptionalString,
  readRequiredNumber,
  readRequiredString,
  readStringArray,
  validateHttpsUrl,
  type ValidationResult
} from "./request-validation";

type Success<T> = { ok: true; value: T };
type Failure = { ok: false; response: ReturnType<typeof buildValidationErrorResponse> };

const bountySeverityValues = ["featured", "high", "open"] as const;
const bountyPlatformTypeValues = ["DEFI", "INFRA", "L2", "WALLET", "ORACLE"] as const;
const acceptedSeverityValues = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const adminStatusValues = [
  "AI SCORED",
  "UNDER REVIEW",
  "DISPUTE WINDOW",
  "DISPUTE OPEN",
  "FIX IN PROGRESS",
  "REJECTED",
  "PAID"
] as const;
const adminSeverityValues = ["CRITICAL", "HIGH", "MEDIUM"] as const;
const researcherStatusValues = [
  "DRAFT",
  "SUBMITTED",
  "AI SCORING",
  "AI SCORED",
  "UNDER REVIEW",
  "FIX IN PROGRESS",
  "DISPUTE WINDOW",
  "DISPUTE OPEN",
  "REJECTED",
  "PAID"
] as const;
const researcherSeverityValues = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const disputeResolutionValues = ["ACCEPT_CLAIM", "HOLD_ORIGINAL", "AUTO_CLOSED"] as const;
const uploadedFileKindValues = ["image", "pdf", "video", "archive", "code", "other"] as const;

function ok<T>(value: T): Success<T> {
  return { ok: true, value };
}

function fail(message: string): Failure {
  return { ok: false, response: buildValidationErrorResponse(message) };
}

function must<T>(result: ValidationResult<T>) {
  if (!result.ok) {
    throw new Error("Tried to unwrap a failed validation result.");
  }

  return result.value;
}

function validateRewardTiers(source: Record<string, unknown>): ValidationResult<RewardTiers> {
  const object = readObject(source, "rewardTiers", [
    "critical",
    "high",
    "medium",
    "low",
    "informational"
  ]);

  if (!object.ok) {
    return object;
  }

  const critical = readRequiredNumber(object.value, "critical", { integer: true, min: 0, max: 1_000_000 });
  const high = readRequiredNumber(object.value, "high", { integer: true, min: 0, max: 1_000_000 });
  const medium = readRequiredNumber(object.value, "medium", { integer: true, min: 0, max: 1_000_000 });
  const low = readRequiredNumber(object.value, "low", { integer: true, min: 0, max: 1_000_000 });
  const informational = readRequiredNumber(object.value, "informational", {
    integer: true,
    min: 0,
    max: 1_000_000
  });

  if (!critical.ok) return critical;
  if (!high.ok) return high;
  if (!medium.ok) return medium;
  if (!low.ok) return low;
  if (!informational.ok) return informational;

  return ok({
    critical: critical.value,
    high: high.value,
    medium: medium.value,
    low: low.value,
    informational: informational.value
  });
}

function validateRecentActivity(source: Record<string, unknown>): ValidationResult<BountyActivity[]> {
  const raw = source.recentActivity;

  if (!Array.isArray(raw) || raw.length > 10) {
    return fail("recentActivity is invalid.");
  }

  const items: BountyActivity[] = [];

  for (const entry of raw) {
    if (!isPlainObject(entry)) {
      return fail("recentActivity is invalid.");
    }

    const id = readRequiredString(entry, "id", { maxLength: 80, pattern: /^[A-Za-z0-9._:-]+$/ });
    const label = readRequiredString(entry, "label", { maxLength: 140 });
    const timestamp = readRequiredString(entry, "timestamp", { maxLength: 60 });
    const outcome = readRequiredString(entry, "outcome", { maxLength: 60 });

    if (!id.ok) return id;
    if (!label.ok) return label;
    if (!timestamp.ok) return timestamp;
    if (!outcome.ok) return outcome;

    items.push({
      id: id.value,
      label: label.value,
      timestamp: timestamp.value,
      outcome: outcome.value
    });
  }

  return ok(items);
}

function validateSeverityDefinitions(
  source: Record<string, unknown>
): ValidationResult<Array<{ label: string; definition: string }>> {
  const raw = source.severityDefinitions;

  if (!Array.isArray(raw) || raw.length > 8) {
    return fail("severityDefinitions is invalid.");
  }

  const items: Array<{ label: string; definition: string }> = [];

  for (const entry of raw) {
    if (!isPlainObject(entry)) {
      return fail("severityDefinitions is invalid.");
    }

    const label = readRequiredString(entry, "label", { maxLength: 40 });
    const definition = readRequiredString(entry, "definition", { maxLength: 220 });

    if (!label.ok) return label;
    if (!definition.ok) return definition;

    items.push({
      label: label.value,
      definition: definition.value
    });
  }

  return ok(items);
}

export function validateBountyDetail(input: Record<string, unknown>): ValidationResult<BountyDetail> {
  const id = readRequiredString(input, "id", { maxLength: 80, pattern: /^[A-Za-z0-9._:-]+$/ });
  const slug = readRequiredString(input, "slug", { maxLength: 100, pattern: /^[a-z0-9-]+$/ });
  const title = readRequiredString(input, "title", { maxLength: 120 });
  const platform = readRequiredString(input, "platform", { maxLength: 60 });
  const platformType = readEnum(input, "platformType", bountyPlatformTypeValues);
  const platformUrl = validateHttpsUrl(String(input.platformUrl ?? ""), "platformUrl", { maxLength: 300 });
  const shortDescription = readRequiredString(input, "shortDescription", { maxLength: 220 });
  const description = readRequiredString(input, "description", { maxLength: 4000 });
  const severity = readEnum(input, "severity", bountySeverityValues);
  const rewardPool = readRequiredNumber(input, "rewardPool", { integer: true, min: 0, max: 5_000_000 });
  const rewardTiers = validateRewardTiers(input);
  const submissionCount = readRequiredNumber(input, "submissionCount", { integer: true, min: 0, max: 100_000 });
  const resolvedCount = readRequiredNumber(input, "resolvedCount", { integer: true, min: 0, max: 100_000 });
  const activeCount = readRequiredNumber(input, "activeCount", { integer: true, min: 0, max: 100_000 });
  const escrowBalance = readRequiredNumber(input, "escrowBalance", { integer: true, min: 0, max: 5_000_000 });
  const escrowAddress = readRequiredString(input, "escrowAddress", { maxLength: 120 });
  const status = readEnum(input, "status", ["ACTIVE"] as const);
  const createdAt = readRequiredString(input, "createdAt", { maxLength: 60 });
  const tags = readStringArray(input, "tags", { maxItems: 10, maxLength: 32 });
  const acceptedSeverities = readEnumArray(input, "acceptedSeverities", acceptedSeverityValues, {
    maxItems: 4,
    minItems: 1
  });
  const acceptedEvidenceTypes = readStringArray(input, "acceptedEvidenceTypes", {
    maxItems: 10,
    maxLength: 40,
    minItems: 1
  });
  const scopeIn = readStringArray(input, "scopeIn", { maxItems: 12, maxLength: 220, minItems: 1 });
  const scopeOut = readStringArray(input, "scopeOut", { maxItems: 12, maxLength: 220 });
  const severityDefinitions = validateSeverityDefinitions(input);
  const rules = readStringArray(input, "rules", { maxItems: 12, maxLength: 220 });
  const recentActivity = validateRecentActivity(input);

  const validations = [
    id,
    slug,
    title,
    platform,
    platformType,
    platformUrl,
    shortDescription,
    description,
    severity,
    rewardPool,
    rewardTiers,
    submissionCount,
    resolvedCount,
    activeCount,
    escrowBalance,
    escrowAddress,
    status,
    createdAt,
    tags,
    acceptedSeverities,
    acceptedEvidenceTypes,
    scopeIn,
    scopeOut,
    severityDefinitions,
    rules,
    recentActivity
  ];

  const failed = validations.find((entry) => !entry.ok);

  if (failed && !failed.ok) {
    return failed;
  }

  return ok({
    id: must(id),
    slug: must(slug),
    title: must(title),
    platform: must(platform),
    platformType: must(platformType),
    platformUrl: must(platformUrl),
    shortDescription: must(shortDescription),
    description: must(description),
    severity: must(severity),
    rewardPool: must(rewardPool),
    rewardTiers: must(rewardTiers),
    submissionCount: must(submissionCount),
    resolvedCount: must(resolvedCount),
    activeCount: must(activeCount),
    escrowBalance: must(escrowBalance),
    escrowAddress: must(escrowAddress),
    status: must(status),
    createdAt: must(createdAt),
    tags: must(tags),
    acceptedSeverities: must(acceptedSeverities) as AcceptedSeverity[],
    acceptedEvidenceTypes: must(acceptedEvidenceTypes),
    scopeIn: must(scopeIn),
    scopeOut: must(scopeOut),
    severityDefinitions: must(severityDefinitions),
    rules: must(rules),
    recentActivity: must(recentActivity)
  });
}

function validateSubScores(source: Record<string, unknown>): ValidationResult<Array<{ label: string; value: number }>> {
  const raw = source.subScores;

  if (!Array.isArray(raw) || raw.length > 8) {
    return fail("subScores is invalid.");
  }

  const items: Array<{ label: string; value: number }> = [];

  for (const entry of raw) {
    if (!isPlainObject(entry)) {
      return fail("subScores is invalid.");
    }

    const label = readRequiredString(entry, "label", { maxLength: 24 });
    const value = readRequiredNumber(entry, "value", { min: 0, max: 1 });

    if (!label.ok) return label;
    if (!value.ok) return value;

    items.push({ label: label.value, value: value.value });
  }

  return ok(items);
}

function validateUploadedFiles(
  source: Record<string, unknown>,
  context?: { userId?: string; bountySlug?: string; submissionId?: string }
): ValidationResult<UploadedEvidenceFile[] | undefined> {
  const raw = source.uploadedFiles;

  if (raw === undefined || raw === null) {
    return ok(undefined);
  }

  if (!Array.isArray(raw) || raw.length > MAX_EVIDENCE_FILES) {
    return fail("uploadedFiles is invalid.");
  }

  const items: UploadedEvidenceFile[] = [];

  for (const entry of raw) {
    if (!isPlainObject(entry)) {
      return fail("uploadedFiles is invalid.");
    }

    const name = readRequiredString(entry, "name", { maxLength: 180 });
    const size = readRequiredNumber(entry, "size", { integer: true, min: 1, max: 50 * 1024 * 1024 });
    const mimeType = readRequiredString(entry, "mimeType", { maxLength: 120, lowercase: true });
    const kind = readEnum(entry, "kind", uploadedFileKindValues);
    const path = readOptionalString(entry, "path", { maxLength: 300 });
    const url = readOptionalString(entry, "url", { maxLength: 500 });

    if (!name.ok) return name;
    if (!size.ok) return size;
    if (!mimeType.ok) return mimeType;
    if (!kind.ok) return kind;
    if (!path.ok) return path;
    if (!url.ok) return url;

    const file: UploadedEvidenceFile = {
      name: name.value,
      size: size.value,
      mimeType: mimeType.value,
      kind: kind.value
    };

    if (path.value) {
      file.path = path.value;
    }

    if (url.value) {
      file.url = url.value;
    }

    const validationError = validateUploadedEvidenceRecord(file, {
      userId: context?.userId,
      bountySlug: context?.bountySlug,
      submissionId: context?.submissionId
    });

    if (validationError) {
      return fail(validationError);
    }

    items.push(file);
  }

  return ok(items);
}

function validateGithubBlock(
  source: Record<string, unknown>
): ValidationResult<{ url: string; repo: string; branch: string; updatedAt: string }> {
  const object = readObject(source, "github", ["url", "repo", "branch", "updatedAt"]);

  if (!object.ok) {
    return object;
  }

  const url = validateHttpsUrl(String(object.value.url ?? ""), "github.url", { maxLength: 300 });
  const repo = readRequiredString(object.value, "repo", { maxLength: 120 });
  const branch = readRequiredString(object.value, "branch", { maxLength: 120 });
  const updatedAt = readRequiredString(object.value, "updatedAt", { maxLength: 60 });

  if (!url.ok) return url;
  if (!repo.ok) return repo;
  if (!branch.ok) return branch;
  if (!updatedAt.ok) return updatedAt;

  return ok({
    url: url.value,
    repo: repo.value,
    branch: branch.value,
    updatedAt: updatedAt.value
  });
}

function validateDisputeNote(
  source: Record<string, unknown>,
  key = "disputeNote"
): ValidationResult<SubmissionDisputeNote | undefined> {
  const raw = source[key];

  if (raw === undefined || raw === null) {
    return ok(undefined);
  }

  if (!isPlainObject(raw)) {
    return fail(`${key} is invalid.`);
  }

  const reason = readRequiredString(raw, "reason", { maxLength: 500 });
  const desiredPct = readRequiredNumber(raw, "desiredPct", { integer: true, min: 0, max: 100 });
  const approvedPct = readRequiredNumber(raw, "approvedPct", { integer: true, min: 0, max: 100 });
  const justification = readOptionalString(raw, "justification", { maxLength: 1500 });
  const openedAt = readOptionalString(raw, "openedAt", { maxLength: 80 });
  const expiresAt = readOptionalString(raw, "expiresAt", { maxLength: 80 });
  const resolution = raw.resolution === undefined
    ? ok<SubmissionDisputeNote["resolution"] | undefined>(undefined)
    : readEnum(raw, "resolution", disputeResolutionValues);

  if (!reason.ok) return reason;
  if (!desiredPct.ok) return desiredPct;
  if (!approvedPct.ok) return approvedPct;
  if (!justification.ok) return justification;
  if (!openedAt.ok) return openedAt;
  if (!expiresAt.ok) return expiresAt;
  if (!resolution.ok) return resolution;

  return ok({
    reason: reason.value,
    desiredPct: desiredPct.value,
    approvedPct: approvedPct.value,
    justification: justification.value,
    openedAt: openedAt.value,
    expiresAt: expiresAt.value,
    resolution: resolution.value
  });
}

export function validateAdminSubmission(
  source: Record<string, unknown>,
  context?: { userId?: string }
): ValidationResult<AdminSubmission> {
  const id = readRequiredString(source, "id", { maxLength: 40, pattern: /^BF-[A-Z0-9-]+$/ });
  const bountySlug = readRequiredString(source, "bountySlug", { maxLength: 100, pattern: /^[a-z0-9-]+$/ });
  const bountyName = readRequiredString(source, "bountyName", { maxLength: 120 });
  const severity = readEnum(source, "severity", adminSeverityValues);
  const title = readRequiredString(source, "title", { maxLength: 180 });
  const reporterName = readOptionalString(source, "reporterName", { maxLength: 80 });
  const reporterAddress = readRequiredString(source, "reporterAddress", { maxLength: 120 });
  const reporterReputation = readRequiredNumber(source, "reporterReputation", { min: 0, max: 10 });
  const submittedAt = readRequiredString(source, "submittedAt", { maxLength: 80 });
  const aiScore = readRequiredNumber(source, "aiScore", { min: 0, max: 10 });
  const status = readEnum(source, "status", adminStatusValues);
  const recommendedPct = readRequiredNumber(source, "recommendedPct", { integer: true, min: 0, max: 100 });
  const tierReward = readRequiredNumber(source, "tierReward", { integer: true, min: 0, max: 1_000_000 });
  const summaryRisk = readRequiredString(source, "summaryRisk", { maxLength: 280 });
  const subScores = validateSubScores(source);
  const evidencePills = readStringArray(source, "evidencePills", { maxItems: 10, maxLength: 60 });
  const description = readRequiredString(source, "description", { maxLength: 5000 });
  const stepsToReproduce = readStringArray(source, "stepsToReproduce", {
    maxItems: 12,
    maxLength: 400,
    minItems: 1
  });
  const impactAssessment = readRequiredString(source, "impactAssessment", { maxLength: 3000 });
  const codeSnippet = readRequiredString(source, "codeSnippet", { maxLength: 12000 });
  const screenshots = readStringArray(source, "screenshots", { maxItems: 12, maxLength: 180 });
  const uploadedFiles = validateUploadedFiles(source, {
    userId: context?.userId,
    bountySlug: bountySlug.ok ? bountySlug.value : undefined,
    submissionId: id.ok ? id.value.toLowerCase().replace(/^bf-/, "sub-") : undefined
  });
  const github = validateGithubBlock(source);
  const internalNote = readOptionalString(source, "internalNote", { maxLength: 2000 });
  const disputeNote = validateDisputeNote(source);

  const validations = [
    id,
    bountySlug,
    bountyName,
    severity,
    title,
    reporterName,
    reporterAddress,
    reporterReputation,
    submittedAt,
    aiScore,
    status,
    recommendedPct,
    tierReward,
    summaryRisk,
    subScores,
    evidencePills,
    description,
    stepsToReproduce,
    impactAssessment,
    codeSnippet,
    screenshots,
    uploadedFiles,
    github,
    internalNote,
    disputeNote
  ];

  const failed = validations.find((entry) => !entry.ok);

  if (failed && !failed.ok) {
    return failed;
  }

  return ok({
    id: must(id),
    bountySlug: must(bountySlug),
    bountyName: must(bountyName),
    severity: must(severity) as AdminSubmissionSeverity,
    title: must(title),
    reporterName: must(reporterName),
    reporterAddress: must(reporterAddress),
    reporterReputation: must(reporterReputation),
    submittedAt: must(submittedAt),
    aiScore: must(aiScore),
    status: must(status) as AdminSubmissionStatus,
    recommendedPct: must(recommendedPct),
    tierReward: must(tierReward),
    summaryRisk: must(summaryRisk),
    subScores: must(subScores),
    evidencePills: must(evidencePills),
    description: must(description),
    stepsToReproduce: must(stepsToReproduce),
    impactAssessment: must(impactAssessment),
    codeSnippet: must(codeSnippet),
    screenshots: must(screenshots),
    uploadedFiles: must(uploadedFiles),
    github: must(github),
    internalNote: must(internalNote),
    disputeNote: must(disputeNote)
  });
}

function validateResearcherEvidence(
  source: Record<string, unknown>,
  context?: { userId?: string; bountySlug?: string; submissionId?: string }
): ValidationResult<ResearcherSubmission["evidence"]> {
  const object = readObject(source, "evidence", [
    "codeFiles",
    "screenshots",
    "githubUrl",
    "references",
    "uploadedFiles"
  ]);

  if (!object.ok) {
    return object;
  }

  const codeFiles = readRequiredNumber(object.value, "codeFiles", { integer: true, min: 0, max: MAX_EVIDENCE_FILES });
  const screenshots = readRequiredNumber(object.value, "screenshots", { integer: true, min: 0, max: MAX_EVIDENCE_FILES });
  const githubUrl = object.value.githubUrl === undefined
    ? ok<string | undefined>(undefined)
    : validateHttpsUrl(String(object.value.githubUrl), "githubUrl", { maxLength: 300 });
  const references = readStringArray(object.value, "references", { maxItems: 12, maxLength: 220 });
  const uploadedFiles = validateUploadedFiles(object.value, {
    userId: context?.userId,
    bountySlug: context?.bountySlug,
    submissionId: context?.submissionId
  });

  if (!codeFiles.ok) return codeFiles;
  if (!screenshots.ok) return screenshots;
  if (!githubUrl.ok) return githubUrl;
  if (!references.ok) return references;
  if (!uploadedFiles.ok) return uploadedFiles;

  return ok({
    codeFiles: codeFiles.value,
    screenshots: screenshots.value,
    githubUrl: githubUrl.value,
    references: references.value,
    uploadedFiles: uploadedFiles.value
  });
}

export function validateResearcherSubmission(
  source: Record<string, unknown>,
  context?: { userId?: string }
): ValidationResult<ResearcherSubmission> {
  const id = readRequiredString(source, "id", { maxLength: 40, pattern: /^sub-[a-z0-9-]+$/ });
  const bountySlug = readRequiredString(source, "bountySlug", { maxLength: 100, pattern: /^[a-z0-9-]+$/ });
  const bountyName = readRequiredString(source, "bountyName", { maxLength: 120 });
  const title = readRequiredString(source, "title", { maxLength: 180 });
  const submittedAt = readRequiredString(source, "submittedAt", { maxLength: 80 });
  const aiScore = readRequiredNumber(source, "aiScore", { min: 0, max: 10 });
  const status = readEnum(source, "status", researcherStatusValues);
  const payout = readRequiredNumber(source, "payout", { integer: true, min: 0, max: 1_000_000 });
  const severity = readEnum(source, "severity", researcherSeverityValues);
  const responseEta = readOptionalString(source, "responseEta", { maxLength: 80 });
  const txHash = readOptionalString(source, "txHash", { maxLength: 180 });
  const description = readRequiredString(source, "description", { maxLength: 5000 });
  const stepsToReproduce = readStringArray(source, "stepsToReproduce", {
    maxItems: 12,
    maxLength: 400,
    minItems: 1
  });
  const impactAssessment = readRequiredString(source, "impactAssessment", { maxLength: 3000 });
  const evidence = validateResearcherEvidence(source, {
    userId: context?.userId,
    bountySlug: bountySlug.ok ? bountySlug.value : undefined,
    submissionId: id.ok ? id.value : undefined
  });
  const dispute = validateDisputeNote(source, "dispute");

  const validations = [
    id,
    bountySlug,
    bountyName,
    title,
    submittedAt,
    aiScore,
    status,
    payout,
    severity,
    responseEta,
    txHash,
    description,
    stepsToReproduce,
    impactAssessment,
    evidence,
    dispute
  ];

  const failed = validations.find((entry) => !entry.ok);

  if (failed && !failed.ok) {
    return failed;
  }

  return ok({
    id: must(id),
    bountySlug: must(bountySlug),
    bountyName: must(bountyName),
    title: must(title),
    submittedAt: must(submittedAt),
    aiScore: must(aiScore),
    status: must(status),
    payout: must(payout),
    severity: must(severity),
    responseEta: must(responseEta),
    txHash: must(txHash),
    description: must(description),
    stepsToReproduce: must(stepsToReproduce),
    impactAssessment: must(impactAssessment),
    evidence: must(evidence),
    dispute: must(dispute)
  });
}

export function validateSubmissionDecision(
  input: Record<string, unknown>
): ValidationResult<SubmissionDecision> {
  const status = readEnum(input, "status", adminStatusValues);
  const payoutPct = readRequiredNumber(input, "payoutPct", { integer: true, min: 0, max: 100 });
  const rejectionReason = readOptionalString(input, "rejectionReason", { maxLength: 500 });
  const disputeNote = validateDisputeNote(input);
  const txHash = readOptionalString(input, "txHash", { maxLength: 180 });

  const validations = [status, payoutPct, rejectionReason, disputeNote, txHash];
  const failed = validations.find((entry) => !entry.ok);

  if (failed && !failed.ok) {
    return failed;
  }

  return ok({
    status: must(status) as AdminSubmissionStatus,
    payoutPct: must(payoutPct),
    rejectionReason: must(rejectionReason),
    disputeNote: must(disputeNote),
    txHash: must(txHash)
  });
}
