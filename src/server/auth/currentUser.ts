import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE } from "./cookie";
import { type SessionUser, validateSessionToken } from "./session";

/**
 * The logged-in user, or null. This is the one place that reads the session
 * (the Data Access Layer). `cache` makes repeat calls in one request free.
 * Reads cookies, so callers must sit inside a <Suspense> boundary.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? validateSessionToken(token) : null;
});

/** The logged-in user; sends everyone else to the login screen. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
