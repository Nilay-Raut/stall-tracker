import { businessDate } from "@/lib/dates";
import { closedProfit, getCloseContext, lastUnclosedDay } from "@/server/days";
import { getDb } from "@/server/db/client";
import { fixedCostForDate, getDayEntries } from "@/server/entries";
import { logoVersion } from "@/server/brand";
import { getExpenseNoteHints } from "@/server/expenseNotes";
import { getQuickAmounts, getRestockHints } from "@/server/hints";
import { listItems } from "@/server/items";
import { isConnected, listConnections } from "@/server/payments/connections";
import { paymentsAvailable } from "@/server/payments/secretBox";
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
  const [
    entries,
    fixedCostPerDay,
    profitIfClosed,
    hints,
    dailyTarget,
    close,
    logo,
    items,
    expenseNotes,
    unclosedDate,
    quickAmounts,
    restock,
  ] = await Promise.all([
    getDayEntries(shop.id, date, { withDeleted: true }),
    fixedCostForDate(getDb(), shop.id, date),
    closedProfit(shop.id, date),
    getPurchaseHints(shop.id),
    dailySalesTarget(shop.id, date),
    getCloseContext(shop, date),
    logoVersion(shop.id),
    listItems(shop.id),
    getExpenseNoteHints(shop.id),
    lastUnclosedDay(shop.id, date),
    getQuickAmounts(shop.id, date),
    getRestockHints(shop.id, date),
  ]);
  const connections = paymentsAvailable() ? await listConnections(shop.id) : [];

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
        accentColor: shop.accentColor,
        paymentsConnected: connections.some(isConnected),
        saleItems: items.map((item) => ({ id: item.id, name: item.name, price: item.price })),
        logoVersion: logo,
        close: {
          openingCash: close.openingCash,
          previous: close.previousClose,
          plateItems: close.plateItems,
          previousCounts: close.previousCounts,
          paymentsConnected: close.paymentsConnected,
        },
        materials: hints.materials,
        suppliers: hints.suppliers,
        expenseNotes,
        fixedCostInDailyProfit: shop.fixedCostInDailyProfit,
        unclosedDate,
        quickAmounts,
        restock,
      }}
      entries={entries}
    />
  );
}
