import type { UploadedEvidenceFile } from "@/lib/dashboard-data";

export const MAX_EVIDENCE_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 10;

const blockedExtensions = new Set([
  "html",
  "htm",
  "svg",
  "exe",
  "dll",
  "bat",
  "cmd",
  "ps1",
  "msi",
  "scr",
  "jar",
  "apk",
  "ipa",
  "iso",
  "php",
  "aspx",
  "sh"
]);

const allowedMimeMatchers: Array<(value: string) => boolean> = [
  (value) => value.startsWith("image/") && value !== "image/svg+xml",
  (value) => value === "application/pdf",
  (value) => value.startsWith("video/"),
  (value) =>
    value.includes("zip") ||
    value.includes("compressed") ||
    value === "application/x-7z-compressed" ||
    value === "application/gzip",
  (value) =>
    value.startsWith("text/") ||
    value === "application/json" ||
    value === "application/yaml" ||
    value === "text/yaml"
];

const signatureMatchers: Record<string, (header: Uint8Array) => boolean> = {
  pdf: (header) =>
    header.length >= 5 &&
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46 &&
    header[4] === 0x2d,
  png: (header) =>
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47,
  jpg: (header) => header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff,
  jpeg: (header) => header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff,
  gif: (header) =>
    header.length >= 4 && header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46,
  zip: (header) => header.length >= 4 && header[0] === 0x50 && header[1] === 0x4b,
  gz: (header) => header.length >= 2 && header[0] === 0x1f && header[1] === 0x8b,
  tgz: (header) => header.length >= 2 && header[0] === 0x1f && header[1] === 0x8b,
  "7z": (header) =>
    header.length >= 6 &&
    header[0] === 0x37 &&
    header[1] === 0x7a &&
    header[2] === 0xbc &&
    header[3] === 0xaf &&
    header[4] === 0x27 &&
    header[5] === 0x1c,
  webm: (header) =>
    header.length >= 4 &&
    header[0] === 0x1a &&
    header[1] === 0x45 &&
    header[2] === 0xdf &&
    header[3] === 0xa3,
  mp4: (header) =>
    header.length >= 8 &&
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70
};

const codeExtensions = new Set([
  "sol",
  "ts",
  "tsx",
  "js",
  "jsx",
  "rs",
  "go",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "md",
  "txt",
  "json",
  "yaml",
  "yml"
]);

function getExtension(name: string) {
  const segments = name.toLowerCase().split(".");
  return segments.length > 1 ? segments.pop() || "" : "";
}

export function validateEvidenceFileMetadata(file: {
  name: string;
  size: number;
  mimeType: string;
}): string | null {
  const name = file.name.trim();
  const mimeType = file.mimeType.trim().toLowerCase();
  const extension = getExtension(name);

  if (!name || name.length > 180) {
    return "Evidence file name is invalid.";
  }

  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_EVIDENCE_FILE_SIZE) {
    return "Evidence file size is invalid.";
  }

  if (!mimeType || mimeType.length > 120) {
    return "Evidence file type is invalid.";
  }

  if (!extension || blockedExtensions.has(extension)) {
    return "This evidence file type is not allowed.";
  }

  const mimeAllowed = allowedMimeMatchers.some((matcher) => matcher(mimeType));

  if (!mimeAllowed) {
    return "This evidence file type is not allowed.";
  }

  return null;
}

async function readFileHeader(file: File) {
  const chunk = await file.slice(0, 32).arrayBuffer();
  return new Uint8Array(chunk);
}

export async function scanEvidenceFile(file: File): Promise<string | null> {
  const metadataError = validateEvidenceFileMetadata({
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream"
  });

  if (metadataError) {
    return metadataError;
  }

  const extension = getExtension(file.name);
  const header = await readFileHeader(file);

  if (extension in signatureMatchers && !signatureMatchers[extension](header)) {
    return "Evidence file content does not match its extension.";
  }

  if (codeExtensions.has(extension)) {
    const preview = await file.slice(0, 2048).text();

    if (preview.includes("\u0000")) {
      return "Evidence code files must be plain text.";
    }
  }

  return null;
}

export function validateUploadedEvidenceRecord(
  file: UploadedEvidenceFile,
  context: {
    userId?: string;
    bountySlug?: string;
    submissionId?: string;
  } = {}
): string | null {
  const metadataError = validateEvidenceFileMetadata({
    name: file.name,
    size: file.size,
    mimeType: file.mimeType
  });

  if (metadataError) {
    return metadataError;
  }

  if (file.path && file.path.length > 300) {
    return "Evidence file path is invalid.";
  }

  if (file.url) {
    try {
      const parsed = new URL(file.url);

      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return "Evidence file URL is invalid.";
      }
    } catch {
      return "Evidence file URL is invalid.";
    }
  }

  if (
    context.userId &&
    context.bountySlug &&
    context.submissionId &&
    file.path
  ) {
    const expectedPrefix = `${context.userId}/${context.bountySlug}/${context.submissionId}/`;

    if (!file.path.startsWith(expectedPrefix)) {
      return "Evidence file path is not scoped to the current submission.";
    }
  }

  return null;
}
