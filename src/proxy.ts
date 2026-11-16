import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/auth/cookie";

const PUBLIC_PATHS = new Set(["/login", "/register", "/forgot"]);

/**
 * Quick check before each page: no session cookie means go to /login.
 * This only looks at the cookie, never the database. The real check
 * (is the session valid?) happens in requireUser() on every page and action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token && !PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();

  // Keep the cookie alive while the app is used (matches the sliding expiry in the
  // database). Only on full page loads: background prefetches still in flight
  // during a logout must not put the cookie back.
  if (token && request.headers.get("sec-fetch-dest") === "document") {
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  }
  return response;
}

export const config = {
  // Skip API routes (they check auth themselves), Next's own files and public assets.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webmanifest|js)$).*)",
  ],
};
