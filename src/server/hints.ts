import "server-only";
import { and, eq, gte, isNull } from "drizzle-orm";
import { commonAmounts } from "@/domain/quickAmounts";
import { RESTOCK_LOOKBACK_DAYS, type RestockHint, restockHints } from "@/domain/restock";
import { type BusinessDate, shiftDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";
import { getDb } from "@/server/db/client";
import { entries, materials, purchases } from "@/server/db/schema";

/** The sale amounts typed most in the last 30 days, for one-tap buttons on Add sale. */
export async function getQuickAmounts(shopId: string, today: BusinessDate): Promise<Paise[]> {
  const rows = await getDb()
    .select({ amount: entries.amount })
    .from(entries)
    .where(
      and(
        eq(entries.shopId, shopId),
        eq(entries.type, "sale"),
        isNull(entries.deletedAt),
        isNull(entries.paidVia), // payments the app added by itself were not typed
        gte(entries.businessDate, shiftDate(today, -30)),
      ),
    )
    .limit(5000);
  return commonAmounts(rows.map((r) => r.amount));
}

/** Materials that are usually bought by now ("Oil every 4 days, 5 days ago"). */
export async function getRestockHints(shopId: string, today: BusinessDate): Promise<RestockHint[]> {
  const rows = await getDb()
    .select({ material: materials.name, date: entries.businessDate })
    .from(purchases)
    .innerJoin(entries, eq(entries.id, purchases.entryId))
    .innerJoin(materials, eq(materials.id, purchases.materialId))
    .where(
      and(
        eq(purchases.shopId, shopId),
        isNull(entries.deletedAt),
        gte(entries.businessDate, shiftDate(today, -RESTOCK_LOOKBACK_DAYS)),
      ),
    )
    .limit(2000);
  return restockHints(rows, today);
}
