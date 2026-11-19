import "server-only";
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import type { BusinessDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";
import { getDb } from "@/server/db/client";
import { days, entries, shops } from "@/server/db/schema";
import type { Shop } from "@/server/db/schema";

/**
 * The stall's UPI/bank balance at the start of `date`, or null when the owner has
 * not told the app a balance yet (or `date` is before it). Worked out from the
 * balance the owner gave and every day since: UPI sales (the closing figure on
 * closed days, as for sales), less expenses and cash outs paid by UPI, plus cash
 * put in the bank.
 */
export async function upiBalanceAtStart(
  shop: Pick<Shop, "id" | "upiBalance" | "upiBalanceDate">,
  date: BusinessDate,
): Promise<Paise | null> {
  if (shop.upiBalance === null || shop.upiBalanceDate === null) return null;
  if (date < shop.upiBalanceDate) return null;
  if (date === shop.upiBalanceDate) return shop.upiBalance;

  const db = getDb();
  const range = (column: typeof days.businessDate | typeof entries.businessDate) =>
    and(gte(column, shop.upiBalanceDate!), lt(column, date));
  const [[sales], [moves]] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${days.upiSales}), 0)` })
      .from(days)
      .where(and(eq(days.shopId, shop.id), range(days.businessDate))),
    db
      .select({
        out: sql<string>`coalesce(sum(case when ${entries.type} in ('expense', 'cash_out', 'fixed_paid')
          and ${entries.paidFrom} = 'upi' then ${entries.amount} else 0 end), 0)`,
        deposits: sql<string>`coalesce(sum(case when ${entries.type} = 'deposit'
          then ${entries.amount} else 0 end), 0)`,
      })
      .from(entries)
      .where(
        and(eq(entries.shopId, shop.id), isNull(entries.deletedAt), range(entries.businessDate)),
      ),
  ]);
  return shop.upiBalance + Number(sales.total) - Number(moves.out) + Number(moves.deposits);
}

/** Stores the balance at the start of `date` (worked out on the phone from "the app shows X now"). */
export async function setUpiBalance(shopId: string, date: BusinessDate, balance: Paise) {
  await getDb()
    .update(shops)
    .set({ upiBalance: balance, upiBalanceDate: date })
    .where(eq(shops.id, shopId));
}
