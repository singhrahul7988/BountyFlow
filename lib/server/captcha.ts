type CaptchaVerificationResult = {
  ok: boolean;
  reason?: string;
};

function getTurnstileSecret() {
  return process.env.TURNSTILE_SECRET_KEY || "";
}

export function isCaptchaConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && getTurnstileSecret());
}

export async function verifyCaptchaToken(token: string | undefined | null, ip?: string | null): Promise<CaptchaVerificationResult> {
  if (!isCaptchaConfigured()) {
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, reason: "CAPTCHA verification is required." };
  }

  const form = new URLSearchParams();
  form.set("secret", getTurnstileSecret());
  form.set("response", token.trim());

  if (ip) {
    form.set("remoteip", ip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    return { ok: false, reason: "CAPTCHA verification failed." };
  }

  const data = (await response.json()) as { success?: boolean };

  return data.success ? { ok: true } : { ok: false, reason: "CAPTCHA verification failed." };
}
