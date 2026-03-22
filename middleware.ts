import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getDefaultRouteForRole,
  getRoleFromProfile,
  isAllowedOwnerEmail,
  type UserRole
} from "@/lib/auth";
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const confirmed = request.nextUrl.searchParams.get("confirmed");

  if (!hasSupabaseEnv()) {
    return NextResponse.next();
  }

  const { response, supabase, user } = await updateSession(request);
  const { profile } = user ? await getProfileByUserId(supabase, user.id) : { profile: null };
  const role = getRoleFromProfile(profile);

  const isResearcherRoute =
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/bounty/") && pathname.endsWith("/submit"));
  const isOwnerRoute = pathname.startsWith("/admin");

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

  return response;
}

export const config = {
  matcher: ["/auth", "/dashboard/:path*", "/admin/:path*", "/bounty/:path*"]
};
