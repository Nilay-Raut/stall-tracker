import "server-only";
import { eq } from "drizzle-orm";
import type { LogoMime } from "@/domain/logo";
import { getDb } from "@/server/db/client";
import { shopLogos, shops } from "@/server/db/schema";

/** Version of the shop's logo (its save time in ms), or null if it has none. */
export async function logoVersion(shopId: string): Promise<number | null> {
  const [row] = await getDb()
    .select({ updatedAt: shopLogos.updatedAt })
    .from(shopLogos)
    .where(eq(shopLogos.shopId, shopId));
  return row ? row.updatedAt.getTime() : null;
}

export async function getLogo(shopId: string) {
  const [row] = await getDb().select().from(shopLogos).where(eq(shopLogos.shopId, shopId));
  return row ?? null;
}

/** Saves (or replaces) the logo. Bytes and type must already be checked. Returns the new version. */
export async function saveLogo(shopId: string, mime: LogoMime, bytes: Buffer): Promise<number> {
  const now = new Date();
  await getDb()
    .insert(shopLogos)
    .values({ shopId, mime, bytes, updatedAt: now })
    .onConflictDoUpdate({ target: shopLogos.shopId, set: { mime, bytes, updatedAt: now } });
  return now.getTime();
}

export async function deleteLogo(shopId: string): Promise<void> {
  await getDb().delete(shopLogos).where(eq(shopLogos.shopId, shopId));
}

/** Null puts the app's own green back. The value must already be checked. */
export async function setAccent(shopId: string, hex: string | null): Promise<void> {
  await getDb().update(shops).set({ accentColor: hex }).where(eq(shops.id, shopId));
}
