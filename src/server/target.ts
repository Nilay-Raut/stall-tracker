import "server-only";
import { and, avg, desc, eq, gte, lt, lte } from "drizzle-orm";
import { fixedCostPerDay, monthlyFixedTotal } from "@/domain/fixedCosts";
import { type TargetInput, type TargetPlan, targetPlan } from "@/domain/target";
import type { ItemStat } from "@/domain/ways";
import type { Month } from "@/lib/calendar";
import { type BusinessDate, daysInMonth, shiftDate } from "@/lib/dates";
import { getDb } from "@/server/db/client";
import { dayItemCounts, fixedCosts, items, monthlyTargets } from "@/server/db/schema";
import { reportDays } from "@/server/reports";

/** The month's profit target in paise, or null if none is set. */
export async function getTarget(shopId: string, month: Month): Promise<number | null> {
  const [row] = await getDb()
    .select({ target: monthlyTargets.profitTarget })
    .from(monthlyTargets)
    .where(and(eq(monthlyTargets.shopId, shopId), eq(monthlyTargets.month, month)));
  return row?.target ?? null;
}

/** The most recent earlier target, to suggest when a new month starts. */
export async function previousTarget(shopId: string, month: Month): Promise<number | null> {
  const [row] = await getDb()
    .select({ target: monthlyTargets.profitTarget })
    .from(monthlyTargets)
    .where(and(eq(monthlyTargets.shopId, shopId), lt(monthlyTargets.month, month)))
    .orderBy(desc(monthlyTargets.month))
    .limit(1);
  return row?.target ?? null;
}

export async function setTarget(shopId: string, month: Month, profitTarget: number) {
  await getDb()
    .insert(monthlyTargets)
    .values({ shopId, month, profitTarget })
    .onConflictDoUpdate({
      target: [monthlyTargets.shopId, monthlyTargets.month],
      set: { profitTarget },
    });
}

/**
 * The target plan for a month, counting the days from the 1st up to and
 * including `throughDate` (pass the day before a date to plan "as of the start of" it).
 */
async function planThrough(
  shopId: string,
  month: Month,
  target: number,
  throughDate: BusinessDate | null,
): Promise<TargetPlan> {
  const first = `${month}-01`;
  const days =
    throughDate && throughDate >= first ? await reportDays(shopId, first, throughDate) : [];
  const costs = await getDb()
    .select({ monthlyAmount: fixedCosts.monthlyAmount })
    .from(fixedCosts)
    .where(eq(fixedCosts.shopId, shopId));
  const total = (pick: (d: (typeof days)[number]) => number) =>
    days.reduce((s, d) => s + pick(d), 0);

  const input: TargetInput = {
    target,
    daysInMonth: daysInMonth(first),
    daysGone: days.length,
    sales: total((d) => d.sales),
    expenses: total((d) => d.expenses),
    fixedCost: total((d) => d.fixedCost),
    openDays: days.filter((d) => d.status !== "off" && d.status !== "none" && d.sales > 0).length,
    fixedPerDay: fixedCostPerDay(monthlyFixedTotal(costs), daysInMonth(first)),
  };
  return targetPlan(input);
}

/** The Target screen's plan: today counted as gone (wireframe: "13 of 30 days gone"). */
export async function monthPlan(shopId: string, month: Month, today: BusinessDate) {
  const target = await getTarget(shopId, month);
  if (target === null) return null;
  return { target, plan: await planThrough(shopId, month, target, today) };
}

/**
 * The sales target for one day, set as of the start of that day from the
 * month before it, so it does not move while the day goes on. Null without a target.
 */
export async function dailySalesTarget(shopId: string, date: BusinessDate): Promise<number | null> {
  const month = date.slice(0, 7);
  const target = await getTarget(shopId, month);
  if (target === null) return null;
  const plan = await planThrough(shopId, month, target, shiftDate(date, -1));
  return plan.salesPerDay;
}

/** Items with their current price and cost and average plates on counted days (last 30 days). */
export async function itemStats(shopId: string, today: BusinessDate): Promise<ItemStat[]> {
  const rows = await getDb()
    .select({
      name: items.name,
      price: items.price,
      cost: items.cost,
      platesPerDay: avg(dayItemCounts.quantity),
    })
    .from(items)
    .leftJoin(
      dayItemCounts,
      and(
        eq(dayItemCounts.itemId, items.id),
        gte(dayItemCounts.businessDate, shiftDate(today, -30)),
        lte(dayItemCounts.businessDate, today),
      ),
    )
    .where(and(eq(items.shopId, shopId), eq(items.active, true)))
    .groupBy(items.id, items.name, items.price, items.cost);
  return rows.map((r) => ({ ...r, platesPerDay: r.platesPerDay ? Number(r.platesPerDay) : 0 }));
}
