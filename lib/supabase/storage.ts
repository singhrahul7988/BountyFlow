"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { UploadedEvidenceFile } from "@/lib/dashboard-data";
import { getSupabaseEvidenceBucket } from "./config";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").toLowerCase();
}

export function getEvidenceKind(name: string, mimeType: string): UploadedEvidenceFile["kind"] {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    /\.(zip|rar|7z|gz|tgz)$/i.test(name)
  ) {
    return "archive";
  }

  if (
    mimeType.startsWith("text/") ||
    /\.(sol|ts|tsx|js|jsx|rs|go|py|java|c|cpp|h|md|txt|json|yaml|yml)$/i.test(name)
  ) {
    return "code";
  }

  return "other";
}

export function toLocalEvidenceFile(file: File): UploadedEvidenceFile {
  return {
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    kind: getEvidenceKind(file.name, file.type || "")
  };
}

export async function uploadEvidenceFiles(
  supabase: SupabaseClient,
  files: File[],
  context: {
    userId: string;
    bountySlug: string;
    submissionId: string;
  }
) {
  const bucket = getSupabaseEvidenceBucket();
  const uploaded: UploadedEvidenceFile[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const safeName = sanitizeFileName(file.name);
    const path = `${context.userId}/${context.bountySlug}/${context.submissionId}/${Date.now()}-${index}-${safeName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined
    });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(bucket).getPublicUrl(path);

    uploaded.push({
      name: file.name,
      path,
      url: publicUrl,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      kind: getEvidenceKind(file.name, file.type || "")
    });
  }

  return uploaded;
}
