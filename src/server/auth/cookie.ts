// Session cookie settings, shared by the session code and the proxy.
// No "server-only" import here because the proxy imports this file too.

const isProd = process.env.NODE_ENV === "production";

/**
 * The "__Host-" prefix makes the browser refuse the cookie unless it is Secure,
 * set for path "/" and has no Domain, so no other site or subdomain can set it.
 * It needs HTTPS, so plain HTTP in development uses an ordinary name.
 */
export const SESSION_COOKIE = isProd ? "__Host-stall_session" : "stall_session";

export const SESSION_DAYS = 30;

export const sessionCookieOptions = {
  httpOnly: true, // page scripts cannot read it
  secure: isProd,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
} as const;
