import "server-only";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser, requireUser } from "@/server/auth/currentUser";
import { getDb } from "@/server/db/client";
import { type FixedCost, type Shop, fixedCosts, shops } from "@/server/db/schema";

// Not exported: callers go through requireShop()/getOwnShop(), which take the
// owner from the session, so nobody can ask for another user's shop by id.
const shopByOwner = cache(async (ownerId: string): Promise<Shop | null> => {
  const [shop] = await getDb().select().from(shops).where(eq(shops.ownerId, ownerId)).limit(1);
  return shop ?? null;
});

/** The logged-in user's shop, or null if setup is not done yet. */
export async function getOwnShop(): Promise<Shop | null> {
  const user = await requireUser();
  return shopByOwner(user.id);
}

/** The logged-in user's shop; sends users who have not finished setup to /setup. */
export async function requireShop(): Promise<Shop> {
  const shop = await getOwnShop();
  if (!shop) redirect("/setup");
  return shop;
}

/**
 * For API routes, which answer with a status code instead of redirecting:
 * the logged-in user's shop, or why there is none.
 */
export async function getShopForApi(): Promise<
  { shop: Shop; userId: string } | { error: "unauthenticated" | "no-shop" }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "unauthenticated" };
  const shop = await shopByOwner(user.id);
  return shop ? { shop, userId: user.id } : { error: "no-shop" };
}

export async function getFixedCosts(shopId: Shop["id"]): Promise<FixedCost[]> {
  return getDb()
    .select()
    .from(fixedCosts)
    .where(eq(fixedCosts.shopId, shopId))
    .orderBy(asc(fixedCosts.sortOrder));
}
