import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { getRoleFromProfile, isAllowedOwnerEmail, type UserRole } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type UnauthorizedAccessLogInput = {
  route: string;
  reason: string;
  status: number;
  userId?: string | null;
  email?: string | null;
  resourceType?: string;
  resourceId?: string | null;
};

type AuthorizationSuccess = {
  supabase: SupabaseServerClient;
  user: User;
  role: UserRole;
};

type AuthorizationResult =
  | ({ error: null } & AuthorizationSuccess)
  | {
      error: NextResponse;
      supabase: SupabaseServerClient;
      user: null;
      role: null;
    };

export function logUnauthorizedAccessAttempt(input: UnauthorizedAccessLogInput) {
  console.warn(
    `[authz] unauthorized access attempt route=${input.route} status=${input.status} reason=${input.reason}` +
      ` userId=${input.userId ?? "anonymous"} email=${input.email ?? "unknown"}` +
      ` resourceType=${input.resourceType ?? "n/a"} resourceId=${input.resourceId ?? "n/a"}`
  );
}

function buildAuthorizationFailure(
  supabase: SupabaseServerClient,
  input: UnauthorizedAccessLogInput,
  message: string
): AuthorizationResult {
  logUnauthorizedAccessAttempt(input);

  return {
    error: NextResponse.json({ error: message }, { status: input.status }),
    supabase,
    user: null,
    role: null
  };
}

export async function requireApiRole(options: {
  route: string;
  roles?: UserRole[];
  requireAllowedOwnerEmail?: boolean;
}): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return buildAuthorizationFailure(
      supabase,
      {
        route: options.route,
        reason: "missing_authenticated_user",
        status: 401
      },
      "Authentication required."
    );
  }

  const { profile } = await getProfileByUserId(supabase, user.id);
  const role = getRoleFromProfile(profile);

  if (!role) {
    return buildAuthorizationFailure(
      supabase,
      {
        route: options.route,
        reason: "missing_profile_role",
        status: 403,
        userId: user.id,
        email: user.email ?? null
      },
      "Profile role is missing."
    );
  }

  if (options.roles?.length && !options.roles.includes(role)) {
    return buildAuthorizationFailure(
      supabase,
      {
        route: options.route,
        reason: `role_mismatch_expected_${options.roles.join("_or_")}_actual_${role}`,
        status: 403,
        userId: user.id,
        email: user.email ?? null
      },
      `${options.roles.map((value) => `${value[0].toUpperCase()}${value.slice(1)}`).join(" or ")} access required.`
    );
  }

  if (role === "owner" && options.requireAllowedOwnerEmail && !isAllowedOwnerEmail(user.email || "")) {
    return buildAuthorizationFailure(
      supabase,
      {
        route: options.route,
        reason: "owner_email_not_allowlisted",
        status: 403,
        userId: user.id,
        email: user.email ?? null
      },
      "Owner access required."
    );
  }

  return {
    error: null,
    supabase,
    user,
    role
  };
}

export function rejectUnauthorizedResourceAccess(options: {
  route: string;
  userId: string;
  email?: string | null;
  resourceType: string;
  resourceId: string;
  message: string;
  status?: number;
}) {
  const status = options.status ?? 403;

  logUnauthorizedAccessAttempt({
    route: options.route,
    reason: "resource_ownership_mismatch",
    status,
    userId: options.userId,
    email: options.email ?? null,
    resourceType: options.resourceType,
    resourceId: options.resourceId
  });

  return NextResponse.json({ error: options.message }, { status });
}

export function rejectMissingOwnedResource(options: {
  route: string;
  userId: string;
  email?: string | null;
  resourceType: string;
  resourceId: string;
  message: string;
}) {
  logUnauthorizedAccessAttempt({
    route: options.route,
    reason: "resource_not_found_or_not_owned",
    status: 404,
    userId: options.userId,
    email: options.email ?? null,
    resourceType: options.resourceType,
    resourceId: options.resourceId
  });

  return NextResponse.json({ error: options.message }, { status: 404 });
}
