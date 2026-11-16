import { businessDate } from "@/lib/dates";
import { closedProfit, getCloseContext } from "@/server/days";
import { getDb } from "@/server/db/client";
import { fixedCostForDate, getDayEntries } from "@/server/entries";
import { getPurchaseHints } from "@/server/purchases";
import { requireShop } from "@/server/queries/shop";
import { dailySalesTarget } from "@/server/target";
import { SnapshotLoader } from "./SnapshotLoader";

/**
 * Server part of Today: loads the shop and today's entries and hands them to the
 * phone, which stores them and shows them. Renders nothing itself, so Today
 * still shows (from the phone's storage) while this is loading or offline.
 */
export async function TodaySnapshot() {
  const shop = await requireShop();
  const date = businessDate();
  const [entries, fixedCostPerDay, profitIfClosed, hints, dailyTarget, close] = await Promise.all([
    getDayEntries(shop.id, date, { withDeleted: true }),
    fixedCostForDate(getDb(), shop.id, date),
    closedProfit(shop.id, date),
    getPurchaseHints(shop.id),
    dailySalesTarget(shop.id, date),
    getCloseContext(shop, date),
  ]);

  return (
    <SnapshotLoader
      snapshot={{
        userId: shop.ownerId,
        shopName: shop.name,
        language: shop.language,
        salesMode: shop.salesMode,
        date,
        fixedCostPerDay,
        closedProfit: profitIfClosed,
        dailyTarget,
        closingTime: shop.closingTime.slice(0, 5),
        close: {
          openingCash: close.openingCash,
          previous: close.previousClose,
          plateItems: close.plateItems,
          previousCounts: close.previousCounts,
        },
        materials: hints.materials,
        suppliers: hints.suppliers,
      }}
      entries={entries}
    />
  );
}
