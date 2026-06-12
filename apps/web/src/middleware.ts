import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PUBLIC_ROUTES,
  AUTH_COOKIE_NAME,
  ROLE_PORTAL_MAP,
  ROLE_PREFIX_MAP,
  ROLES,
  type UserRole,
} from "@/lib/constants";

function isUserRole(value: string | undefined): value is UserRole {
  return Object.values(ROLES).includes(value as UserRole);
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete("mediflow_role");
  return response;
}

/**
 * RoleGuard Middleware
 *
 * 1. Public routes (login, register, forgot-password, verify-email) — always accessible.
 * 2. For authenticated users, a `mediflow_role` cookie indicates role (set by login page client).
 *    The refresh token cookie presence indicates a valid session.
 * 3. Authenticated users accessing wrong portal → redirect to their portal.
 * 4. Unauthenticated users accessing protected routes → redirect to /login.
 * 5. Authenticated users hitting public routes → redirect to their dashboard.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, API routes, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session — refresh token cookie presence indicates active session
  const hasSession = request.cookies.has(AUTH_COOKIE_NAME);
  const rawRoleCookie = request.cookies.get("mediflow_role")?.value;
  const roleCookie = isUserRole(rawRoleCookie) ? rawRoleCookie : undefined;

  // Redirect unauthenticated /login and /register requests to root /
  if (!hasSession) {
    if (pathname === "/login") {
      const redirectUrl = new URL("/", request.url);
      request.nextUrl.searchParams.forEach((val, key) => redirectUrl.searchParams.set(key, val));
      return NextResponse.redirect(redirectUrl);
    }
    if (pathname === "/register") {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("register", "true");
      request.nextUrl.searchParams.forEach((val, key) => redirectUrl.searchParams.set(key, val));
      return NextResponse.redirect(redirectUrl);
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  ) || pathname === "/";

  if (hasSession && rawRoleCookie && !roleCookie) {
    const redirectUrl = new URL("/", request.url);
    if (!isPublicRoute && pathname !== "/") {
      redirectUrl.searchParams.set("redirect", pathname);
    }
    return clearAuthCookies(NextResponse.redirect(redirectUrl));
  }

  // ── Unauthenticated user on protected route → Hero Page (root) ──
  if (!hasSession && !isPublicRoute) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ── Authenticated user on public route → dashboard ──
  if (hasSession && isPublicRoute) {
    if (!roleCookie) {
      return clearAuthCookies(NextResponse.next());
    }

    const dashboard = ROLE_PORTAL_MAP[roleCookie];
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // ── Authenticated user on wrong portal → correct portal ──
  if (hasSession && roleCookie && !isPublicRoute) {
    const correctPrefix = ROLE_PREFIX_MAP[roleCookie];
    if (correctPrefix) {
      const isOnCorrectPortal = pathname.startsWith(correctPrefix);

      // Root path → redirect to dashboard
      if (pathname === "/") {
        const dashboard = ROLE_PORTAL_MAP[roleCookie];
        return NextResponse.redirect(new URL(dashboard, request.url));
      }

      // Wrong portal → redirect to correct dashboard
      if (!isOnCorrectPortal) {
        const dashboard = ROLE_PORTAL_MAP[roleCookie];
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
