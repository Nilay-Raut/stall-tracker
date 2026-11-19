import "server-only";
import { and, eq, gte, isNull, lt, lte } from "drizzle-orm";
import { type FixedCostMonth, fixedCostsMonth } from "@/domain/fixedPaid";
import { type BusinessDate, daysInMonth } from "@/lib/dates";
import { getDb } from "@/server/db/client";
import { entries } from "@/server/db/schema";
import { getFixedCosts } from "@/server/queries/shop";

/**
 * Each fixed cost of the month `date` is in, with what has been paid towards it.
 * `beforeDate` leaves out that day's payments: the phone adds today's itself, from
 * its own storage, so a payment it has not sent yet still counts.
 */
export async function getFixedCostsMonth(
  shopId: string,
  date: BusinessDate,
  { beforeDate = false } = {},
): Promise<FixedCostMonth[]> {
  const month = date.slice(0, 7);
  const [costs, payments] = await Promise.all([
    getFixedCosts(shopId),
    getDb()
      .select({ note: entries.note, amount: entries.amount })
      .from(entries)
      .where(
        and(
          eq(entries.shopId, shopId),
          eq(entries.type, "fixed_paid"),
          isNull(entries.deletedAt),
          gte(entries.businessDate, `${month}-01`),
          beforeDate
            ? lt(entries.businessDate, date)
            : lte(entries.businessDate, `${month}-${daysInMonth(date)}`),
        ),
      ),
  ]);
  return fixedCostsMonth(costs, payments);
}
