export function validatePasswordStrength(password: string) {
  const normalized = password || "";

  if (normalized.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[a-z]/.test(normalized) || !/[A-Z]/.test(normalized) || !/\d/.test(normalized)) {
    return "Password must include uppercase, lowercase, and numeric characters.";
  }

  return null;
}
