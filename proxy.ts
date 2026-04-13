import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getDefaultRouteForRole,
  getRoleFromProfile,
  isAllowedOwnerEmail,
  type UserRole
} from "@/lib/auth";
import { logUnauthorizedAccessAttempt } from "@/lib/server/authorization";
import {
  applySessionTrackingCookies,
  clearSessionTrackingCookies,
  clearSupabaseAuthCookies,
  getSessionWindowState,
  refreshSessionActivityCookie
} from "@/lib/server/auth-session";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";
import { getProfileByUserId } from "@/lib/supabase/profiles";

function buildAuthRedirect(request: NextRequest, role: UserRole, reason: "auth" | "role") {
  const url = new URL("/auth", request.url);
  url.searchParams.set("role", role);
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

function buildApiError(
  request: NextRequest,
  status: number,
  message: string,
  reason: string,
  user?: { id: string; email?: string | null } | null
) {
  logUnauthorizedAccessAttempt({
    route: request.nextUrl.pathname,
    reason,
    status,
    userId: user?.id ?? null,
    email: user?.email ?? null
  });

  return NextResponse.json({ error: message }, { status });
}

function buildSessionExpiredResponse(request: NextRequest, isApiRoute: boolean, reason: string) {
  logUnauthorizedAccessAttempt({
    route: request.nextUrl.pathname,
    reason,
    status: 401
  });

  const message =
    reason === "email_not_confirmed"
      ? "Verify your email before signing in."
      : "Session expired. Sign in again.";

  const response = isApiRoute
    ? NextResponse.json({ error: message }, { status: 401 })
    : (() => {
        const redirectTarget = new URL("/auth", request.url);
        redirectTarget.searchParams.set(
          "reason",
          reason === "email_not_confirmed" ? "email_unverified" : "session_expired"
        );
        redirectTarget.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(redirectTarget);
      })();

  clearSessionTrackingCookies(response, request.url);
  clearSupabaseAuthCookies(response, request);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const confirmed = request.nextUrl.searchParams.get("confirmed");

  if (!hasSupabaseEnv()) {
    return NextResponse.next();
  }

  const { response, supabase, user } = await updateSession(request);
  const { profile } = user ? await getProfileByUserId(supabase, user.id) : { profile: null };
  const role = getRoleFromProfile(profile);
  const isApiRoute = pathname.startsWith("/api/");
  const sessionState = user ? getSessionWindowState(request.cookies) : null;

  const isResearcherRoute =
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/bounty/") && pathname.endsWith("/submit"));
  const isOwnerRoute = pathname.startsWith("/admin");
  const isOwnerApiRoute =
    pathname === "/api/treasury" ||
    pathname.startsWith("/api/notifications/") ||
    (pathname === "/api/bounties" && request.method === "POST") ||
    (pathname === "/api/submissions" && request.method !== "POST") ||
    (pathname.startsWith("/api/submissions/") &&
      !pathname.endsWith("/dispute"));
  const isResearcherApiRoute =
    (pathname === "/api/submissions" && request.method === "POST") ||
    pathname.endsWith("/dispute");
  const isAuthenticatedApiRoute =
    pathname === "/api/demo-state" || pathname === "/api/profile/wallet";

  if (user && !user.email_confirmed_at && pathname !== "/auth" && pathname !== "/auth/confirmed") {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      await supabase.auth.signOut();
    }

    return buildSessionExpiredResponse(request, isApiRoute, "email_not_confirmed");
  }

  if (user && sessionState?.expired) {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      await supabase.auth.signOut();
    }

    return buildSessionExpiredResponse(
      request,
      isApiRoute,
      sessionState.idleExpired ? "session_idle_timeout" : "session_max_age_exceeded"
    );
  }

  if (isApiRoute) {
    if (isOwnerApiRoute) {
      if (!user || !role) {
        return buildApiError(request, 401, "Authentication required.", "missing_authenticated_user", user);
      }

      if (role !== "owner" || !isAllowedOwnerEmail(user.email || "")) {
        return buildApiError(request, 403, "Owner access required.", "owner_api_role_mismatch", user);
      }
    }

    if (isResearcherApiRoute) {
      if (!user || !role) {
        return buildApiError(request, 401, "Authentication required.", "missing_authenticated_user", user);
      }

      if (role !== "researcher") {
        return buildApiError(
          request,
          403,
          "Researcher access required.",
          "researcher_api_role_mismatch",
          user
        );
      }
    }

    if (isAuthenticatedApiRoute && (!user || !role)) {
      return buildApiError(request, 401, "Authentication required.", "missing_authenticated_user", user);
    }
  }

  if (pathname === "/auth" && role && confirmed !== "1") {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url));
  }

  if (isResearcherRoute) {
    if (!user || !role) {
      return buildAuthRedirect(request, "researcher", "auth");
    }

    if (role !== "researcher") {
      return buildAuthRedirect(request, role, "role");
    }
  }

  if (isOwnerRoute) {
    if (!user || !role) {
      return buildAuthRedirect(request, "owner", "auth");
    }

    if (role !== "owner" || !isAllowedOwnerEmail(user.email || "")) {
      return buildAuthRedirect(request, role, "role");
    }
  }

  if (user && role) {
    if (sessionState?.missingTracking) {
      applySessionTrackingCookies(response, request.url);
    } else {
      refreshSessionActivityCookie(response, request.url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/auth",
    "/dashboard/:path*",
    "/admin/:path*",
    "/bounty/:path*",
    "/api/bounties",
    "/api/demo-state",
    "/api/notifications/:path*",
    "/api/profile/:path*",
    "/api/submissions/:path*",
    "/api/treasury"
  ]
};
