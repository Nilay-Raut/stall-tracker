import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";
import { SESSION_COOKIE, SESSION_DAYS, sessionCookieOptions } from "./cookie";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Push the expiry forward once less than this many days are left. */
const RENEW_WHEN_DAYS_LEFT = 15;

export type SessionUser = { id: string; phone: string };

/** Only the hash is stored, so a leaked database cannot be used to log in. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a session and sets the cookie. Call from a Server Action only. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await getDb()
    .insert(sessions)
    .values({
      id: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * DAY_MS),
    });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

/** Returns the user for a cookie token, or null if unknown or expired. */
export async function validateSessionToken(token: string): Promise<SessionUser | null> {
  const db = getDb();
  const id = hashToken(token);

  const [row] = await db
    .select({ expiresAt: sessions.expiresAt, userId: users.id, phone: users.phone })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .limit(1);

  if (!row) return null;

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  // Sliding expiry: people who use the app regularly stay logged in.
  if (row.expiresAt.getTime() - now < RENEW_WHEN_DAYS_LEFT * DAY_MS) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(now + SESSION_DAYS * DAY_MS) })
      .where(eq(sessions.id, id));
  }

  return { id: row.userId, phone: row.phone };
}

/** Logs out this device. Call from a Server Action only. */
export async function deleteCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb()
      .delete(sessions)
      .where(eq(sessions.id, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Logs out every device, e.g. after a password reset. */
export async function deleteAllSessions(userId: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.userId, userId));
}
