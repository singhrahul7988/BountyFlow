"use client";

import type { UploadedEvidenceFile } from "@/lib/dashboard-data";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(size / 1024)} KB`;
}

function kindLabel(kind: UploadedEvidenceFile["kind"]) {
  return kind.replace(/^[a-z]/, (match) => match.toUpperCase());
}

function getSafeExternalUrl(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function EvidenceUploadsPanel({
  files,
  emptyLabel = "No uploaded evidence files are attached to this submission yet."
}: {
  files: UploadedEvidenceFile[];
  emptyLabel?: string;
}) {
  if (!files.length) {
    return (
      <div className="bg-background p-5">
        <p className="text-sm leading-7 text-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {files.map((file) => {
        const safeUrl = getSafeExternalUrl(file.url);

        return (
          <div key={`${file.path || file.name}-${file.size}`} className="bg-background p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="bf-label text-primary">{kindLabel(file.kind)}</p>
                <p className="text-sm leading-7 text-foreground">{file.name}</p>
              </div>
              <span className="bf-label text-muted">{formatFileSize(file.size)}</span>
            </div>

            <div className="mt-4 space-y-2">
              <p className="bf-label">TYPE</p>
              <p className="text-sm leading-7 text-muted">{file.mimeType}</p>
            </div>

            {safeUrl ? (
              <a
                href={safeUrl}
                target="_blank"
                rel="noreferrer"
                className="bf-button-tertiary mt-5"
              >
                OPEN FILE
              </a>
            ) : (
              <p className="mt-5 text-sm leading-7 text-amber">
                File metadata is available only in the local demo session. Remote URL was not created.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
