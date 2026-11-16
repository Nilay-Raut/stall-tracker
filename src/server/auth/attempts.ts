import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { authAttempts } from "@/server/db/schema";

export type AttemptKind = "login" | "recovery";

const MAX_FAILURES = 5;

/**
 * How long a phone number is locked after 5 wrong tries. A 6-digit recovery PIN
 * has only a million options, so it gets a much longer lock than the password.
 */
const LOCK_MINUTES: Record<AttemptKind, number> = { login: 15, recovery: 24 * 60 };

const lockMs = (kind: AttemptKind) => LOCK_MINUTES[kind] * 60 * 1000;

const match = (phone: string, kind: AttemptKind) =>
  and(eq(authAttempts.phone, phone), eq(authAttempts.kind, kind));

/** Minutes left on a lock, or 0 if the number is not locked. */
export async function minutesLocked(phone: string, kind: AttemptKind): Promise<number> {
  const [row] = await getDb()
    .select({ lockedUntil: authAttempts.lockedUntil })
    .from(authAttempts)
    .where(match(phone, kind))
    .limit(1);

  const msLeft = (row?.lockedUntil?.getTime() ?? 0) - Date.now();
  return msLeft > 0 ? Math.ceil(msLeft / 60000) : 0;
}

/**
 * Counts a wrong try, recorded for unregistered numbers too so locks reveal nothing.
 * Old failures (from before the lock window) do not count towards a new lock.
 */
export async function recordFailure(phone: string, kind: AttemptKind): Promise<void> {
  const db = getDb();
  const windowStart = new Date(Date.now() - lockMs(kind));

  const [row] = await db
    .insert(authAttempts)
    .values({ phone, kind, failedCount: 1 })
    .onConflictDoUpdate({
      target: [authAttempts.phone, authAttempts.kind],
      set: {
        failedCount: sql`case when ${authAttempts.updatedAt} < ${windowStart.toISOString()}
          then 1 else ${authAttempts.failedCount} + 1 end`,
        updatedAt: new Date(),
      },
    })
    .returning({ failedCount: authAttempts.failedCount });

  if (row && row.failedCount >= MAX_FAILURES) {
    await db
      .update(authAttempts)
      .set({ failedCount: 0, lockedUntil: new Date(Date.now() + lockMs(kind)) })
      .where(match(phone, kind));
  }
}

export async function clearFailures(phone: string, kind: AttemptKind): Promise<void> {
  await getDb().delete(authAttempts).where(match(phone, kind));
}
