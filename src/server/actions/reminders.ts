"use server";

import { z } from "zod";
import { requireShop } from "@/server/queries/shop";
import { addSubscription, reminderPublicKey, removeSubscription } from "@/server/reminders";

// Push services use HTTPS; requiring it also stops a made-up subscription from
// making the server call plain-HTTP addresses inside the network.
const endpointSchema = z.url({ protocol: /^https$/ });

const subscriptionSchema = z.object({
  endpoint: endpointSchema.max(1000),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
});

/** Saves this phone's push subscription and switches the closing-time reminder on. */
export async function turnOnReminder(
  subscription: unknown,
): Promise<"ok" | "unavailable" | "invalid"> {
  const shop = await requireShop();
  if (!reminderPublicKey()) return "unavailable";
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return "invalid";
  const { endpoint, keys } = parsed.data;
  await addSubscription(shop.ownerId, shop.id, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
  return "ok";
}

/** Stops reminders on this phone. */
export async function turnOffReminder(endpoint: string): Promise<void> {
  const shop = await requireShop();
  if (typeof endpoint === "string" && endpoint.length <= 1000) {
    await removeSubscription(shop.ownerId, shop.id, endpoint);
  }
}
