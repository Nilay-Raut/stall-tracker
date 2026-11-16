import "server-only";
import { and, eq } from "drizzle-orm";
import { WebPushError, sendNotification } from "web-push";
import { isReminderDue } from "@/domain/reminder";
import { translator } from "@/i18n/translate";
import { businessDate, businessTime } from "@/lib/dates";
import { serverEnv } from "@/lib/env";
import { getDb } from "@/server/db/client";
import { days, pushSubscriptions, shops } from "@/server/db/schema";

export type SubscriptionInput = { endpoint: string; p256dh: string; auth: string };

/** The public key phones need to subscribe, or null when reminders are not set up. */
export function reminderPublicKey(): string | null {
  const env = serverEnv();
  return env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY ? env.VAPID_PUBLIC_KEY : null;
}

/** Saves this phone's subscription and switches the shop's reminder on. */
export async function addSubscription(userId: string, shopId: string, sub: SubscriptionInput) {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .insert(pushSubscriptions)
      .values({ userId, shopId, ...sub })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, shopId, p256dh: sub.p256dh, auth: sub.auth },
      });
    await tx.update(shops).set({ reminderEnabled: true }).where(eq(shops.id, shopId));
  });
}

/**
 * Removes this phone's subscription (only one of the user's own). The shop's
 * reminder switches off when no phone wants it any more.
 */
export async function removeSubscription(userId: string, shopId: string, endpoint: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
    const left = await tx
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.shopId, shopId))
      .limit(1);
    if (left.length === 0) {
      await tx.update(shops).set({ reminderEnabled: false }).where(eq(shops.id, shopId));
    }
  });
}

/** Whether this phone is subscribed (by its endpoint), for the Settings switch. */
export async function isSubscribed(userId: string, endpoint: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  return !!row;
}

/**
 * Sends the closing-time reminder to every shop where it is due (rule 17).
 * Called every few minutes by the server's own timer. Returns how many were sent.
 */
export async function sendDueReminders(now: Date = new Date()): Promise<{ sent: number }> {
  const env = serverEnv();
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return { sent: 0 };
  const vapidDetails = {
    subject: env.VAPID_SUBJECT ?? "mailto:reminders@stall-tracker.invalid",
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };

  const db = getDb();
  const today = businessDate(now);
  const time = businessTime(now);
  const candidates = await db
    .select({
      id: shops.id,
      language: shops.language,
      closingTime: shops.closingTime,
      lastReminderDate: shops.lastReminderDate,
      todayStatus: days.status,
    })
    .from(shops)
    .leftJoin(days, and(eq(days.shopId, shops.id), eq(days.businessDate, today)))
    .where(eq(shops.reminderEnabled, true));

  let sent = 0;
  for (const shop of candidates) {
    const due = isReminderDue({
      reminderEnabled: true,
      closingTime: shop.closingTime.slice(0, 5),
      now: time,
      today,
      lastReminderDate: shop.lastReminderDate,
      todayStatus: shop.todayStatus ?? "none",
    });
    if (!due) continue;

    // Mark first, so a slow push service can never cause a second reminder.
    await db.update(shops).set({ lastReminderDate: today }).where(eq(shops.id, shop.id));

    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.shopId, shop.id));
    const t = translator(shop.language);
    for (const sub of subscriptions) {
      try {
        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          // No money figures: the text shows on the lock screen.
          JSON.stringify({
            title: t("Time to close the day"),
            body: t("Count the drawer and close the day in Stall Tracker."),
            url: "/close/today",
          }),
          { vapidDetails, TTL: 6 * 60 * 60, urgency: "normal" },
        );
        sent += 1;
      } catch (error) {
        // 404/410: the phone unsubscribed or the app was removed. Forget it.
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error("Reminder push failed", error);
        }
      }
    }
  }
  return { sent };
}
