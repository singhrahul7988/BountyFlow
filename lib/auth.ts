import type { User } from "@supabase/supabase-js";

export type UserRole = "researcher" | "owner";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  wallet_address: string | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletAddress: string;
  walletLinked: boolean;
};

function hashToHex(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(16).padStart(8, "0");
}

function buildWalletAddress(seed: string) {
  const segment = `${hashToHex(seed)}${hashToHex(`${seed}-bf`)}`.slice(0, 16);
  return `0x${segment.toUpperCase()}`;
}

export function getDefaultRouteForRole(role: UserRole) {
  return role === "owner" ? "/admin" : "/dashboard";
}

export function getAuthHref(role: UserRole, nextPath?: string) {
  const params = new URLSearchParams();
  params.set("role", role);

  if (nextPath) {
    params.set("next", nextPath);
  }

  return `/auth?${params.toString()}`;
}

export function getAllowedOwnerEmails() {
  const raw =
    process.env.OWNER_ALLOWED_EMAILS ||
    process.env.NEXT_PUBLIC_OWNER_ALLOWED_EMAILS ||
    "";

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedOwnerEmail(email: string) {
  const allowlist = getAllowedOwnerEmails();

  if (!allowlist.length) {
    return true;
  }

  return allowlist.includes(email.trim().toLowerCase());
}

export function getRoleFromProfile(profile: UserProfile | null | undefined): UserRole | null {
  if (!profile) {
    return null;
  }

  return profile.role === "owner" || profile.role === "researcher" ? profile.role : null;
}

export function mapSupabaseUser(
  user: User | null | undefined,
  profile: UserProfile | null | undefined
): AuthUser | null {
  const role = getRoleFromProfile(profile);

  if (!user || !role) {
    return null;
  }

  return {
    id: user.id,
    name: profile?.full_name || user.email?.split("@")[0] || "BountyFlow User",
    email: profile?.email || user.email || "",
    role,
    walletAddress: profile?.wallet_address || buildWalletAddress(user.id),
    walletLinked: Boolean(profile?.wallet_address)
  };
}
