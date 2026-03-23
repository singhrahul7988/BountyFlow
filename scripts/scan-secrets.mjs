import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "out",
  "Tether"
]);

const ignoredFileNames = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.test",
  ".env.test.local"
]);

function collectFiles(directory, relativeBase = "") {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...collectFiles(absolutePath, relativePath));
      }
      continue;
    }

    if (entry.isFile()) {
      if (ignoredFileNames.has(entry.name)) {
        continue;
      }
      files.push(relativePath);
    }
  }

  return files;
}

const trackedFiles = collectFiles(repoRoot);

const ignoredExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".lock",
  ".pdf",
  ".mp4",
  ".webm"
]);

const safePlaceholders = [
  "your-project-ref.supabase.co",
  "your-supabase-publishable-key",
  "your-supabase-anon-key",
  "owner@example.com",
  "your-evm-rpc-url",
  "your twelve word seed phrase",
  "0xYourUsdtTokenContract",
  "your-google-ai-studio-api-key",
  "your-cloudflare-turnstile-site-key",
  "your-cloudflare-turnstile-secret-key",
  "your-project-url",
  "your-publishable-key",
  "example.com"
];

const patterns = [
  {
    name: "Private key assignment",
    regex:
      /\b(?:[A-Z][A-Z0-9_]*?(?:PRIVATE_KEY|SECRET_KEY|API_KEY|TOKEN|SEED_PHRASE|DATABASE_URL|CONNECTION_STRING)|PRIVATE_KEY|SECRET_KEY|API_KEY|TOKEN|SEED_PHRASE|DATABASE_URL|CONNECTION_STRING)\b\s*[:=]\s*["'`](?!your-|owner@example\.com)[A-Za-z0-9+/_=.:~-]{16,}/
  },
  {
    name: "Supabase service role key",
    regex: /\bservice_role\b/i
  },
  {
    name: "Google API key",
    regex: /\bAIza[0-9A-Za-z\-_]{20,}\b/
  },
  {
    name: "GitHub token",
    regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/
  },
  {
    name: "AWS access key",
    regex: /\bAKIA[0-9A-Z]{16}\b/
  },
  {
    name: "JWT-like token",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}\b/
  },
  {
    name: "Long hex secret",
    regex: /\b0x[a-fA-F0-9]{64,}\b/
  }
];

const findings = [];

for (const file of trackedFiles) {
  if (ignoredExtensions.has(path.extname(file).toLowerCase())) {
    continue;
  }

  const absolutePath = path.join(repoRoot, file);
  let content = "";

  try {
    if (statSync(absolutePath).size > 1_000_000) {
      continue;
    }

    content = readFileSync(absolutePath, "utf8");
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const normalizedLine = line.trim();

    if (!normalizedLine) {
      return;
    }

    if (safePlaceholders.some((placeholder) => normalizedLine.includes(placeholder))) {
      return;
    }

    for (const pattern of patterns) {
      if (pattern.regex.test(normalizedLine)) {
        findings.push({
          file,
          line: index + 1,
          rule: pattern.name
        });
        break;
      }
    }
  });
}

if (findings.length) {
  console.error("Potential secrets detected in tracked files:");
  findings.forEach((finding) => {
    console.error(`- ${finding.file}:${finding.line} (${finding.rule})`);
  });
  process.exit(1);
}

console.log(`Secret scan passed across ${trackedFiles.length} tracked files.`);
