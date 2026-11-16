import "server-only";
import { and, asc, avg, eq, gte, inArray } from "drizzle-orm";
import type { PlateCount } from "@/domain/plates";
import { type BusinessDate, businessDate, shiftDate } from "@/lib/dates";
import { type Tx, getDb } from "@/server/db/client";
import { type Item, dayItemCounts, items } from "@/server/db/schema";

export const MAX_ITEMS = 30;

/** A shop's items, in the owner's order. Removed items only when asked. */
export async function listItems(shopId: string, { includeRemoved = false } = {}): Promise<Item[]> {
  return getDb()
    .select()
    .from(items)
    .where(and(eq(items.shopId, shopId), includeRemoved ? undefined : eq(items.active, true)))
    .orderBy(asc(items.sortOrder), asc(items.createdAt));
}

/** One of the shop's own items (never another shop's), or null. */
export async function getItem(shopId: string, id: string): Promise<Item | null> {
  const [item] = await getDb()
    .select()
    .from(items)
    .where(and(eq(items.shopId, shopId), eq(items.id, id), eq(items.active, true)));
  return item ?? null;
}

type ItemValues = { name: string; price: number; cost: number };

export async function createItem(shopId: string, values: ItemValues): Promise<void> {
  const existing = await listItems(shopId);
  await getDb()
    .insert(items)
    .values({ shopId, ...values, sortOrder: existing.length });
}

export async function updateItem(shopId: string, id: string, values: ItemValues) {
  await getDb()
    .update(items)
    .set(values)
    .where(and(eq(items.shopId, shopId), eq(items.id, id)));
}

/** Hides an item. It stays in the database so past plate counts keep their names. */
export async function removeItem(shopId: string, id: string) {
  await getDb()
    .update(items)
    .set({ active: false })
    .where(and(eq(items.shopId, shopId), eq(items.id, id)));
}

/** Average plates sold per counted day over the last 30 days, or null if never counted. */
export async function averagePlates(shopId: string, itemId: string): Promise<number | null> {
  const [row] = await getDb()
    .select({ average: avg(dayItemCounts.quantity) })
    .from(dayItemCounts)
    .where(
      and(
        eq(dayItemCounts.shopId, shopId),
        eq(dayItemCounts.itemId, itemId),
        gte(dayItemCounts.businessDate, shiftDate(businessDate(), -30)),
      ),
    );
  return row?.average ? Math.round(Number(row.average)) : null;
}

/** A day's plate counts with item names and that day's prices. */
export async function getDayCounts(
  shopId: string,
  date: BusinessDate,
): Promise<Array<PlateCount & { itemId: string }>> {
  const rows = await getDb()
    .select({
      itemId: dayItemCounts.itemId,
      name: items.name,
      quantity: dayItemCounts.quantity,
      price: dayItemCounts.priceAtTime,
      cost: dayItemCounts.costAtTime,
    })
    .from(dayItemCounts)
    .innerJoin(items, eq(items.id, dayItemCounts.itemId))
    .where(and(eq(dayItemCounts.shopId, shopId), eq(dayItemCounts.businessDate, date)))
    .orderBy(asc(items.sortOrder));
  return rows;
}

/**
 * Replaces a day's plate counts. Items already counted that day keep the price
 * and cost saved then; newly counted items take today's price and cost.
 */
export async function replaceDayCounts(
  tx: Tx,
  shopId: string,
  date: BusinessDate,
  counts: ReadonlyArray<{ itemId: string; quantity: number }>,
): Promise<void> {
  const wanted = counts.filter((c) => c.quantity > 0);
  const where = and(eq(dayItemCounts.shopId, shopId), eq(dayItemCounts.businessDate, date));

  const before = new Map(
    (await tx.select().from(dayItemCounts).where(where)).map((row) => [row.itemId, row]),
  );
  await tx.delete(dayItemCounts).where(where);
  if (wanted.length === 0) return;

  // Only this shop's items can be counted.
  const shopItems = new Map(
    (
      await tx
        .select()
        .from(items)
        .where(
          and(
            eq(items.shopId, shopId),
            inArray(
              items.id,
              wanted.map((c) => c.itemId),
            ),
          ),
        )
    ).map((item) => [item.id, item]),
  );

  const rows = wanted.flatMap((c) => {
    const item = shopItems.get(c.itemId);
    if (!item) return [];
    const kept = before.get(c.itemId);
    return [
      {
        shopId,
        businessDate: date,
        itemId: c.itemId,
        quantity: c.quantity,
        priceAtTime: kept?.priceAtTime ?? item.price,
        costAtTime: kept?.costAtTime ?? item.cost,
      },
    ];
  });
  if (rows.length > 0) await tx.insert(dayItemCounts).values(rows);
}
