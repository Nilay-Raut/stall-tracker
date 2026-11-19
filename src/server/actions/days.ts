"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { businessDate, shiftDate } from "@/lib/dates";
import { MAX_ENTRY_AMOUNT } from "@/domain/entry";
import { parseRupeeInput } from "@/lib/money";
import { type MarkOffResult, setOpeningCash, setShopClosed } from "@/server/days";
import { requireShop } from "@/server/queries/shop";

const dateSchema = z.iso.date();

/** Marks a day as "shop closed" (off = true) or open again. Refreshes the Calendar. */
export async function markShopClosed(
  date: string,
  off: boolean,
): Promise<MarkOffResult | "bad-date"> {
  const shop = await requireShop();
  const today = businessDate();
  if (!dateSchema.safeParse(date).success || date > today || date < shiftDate(today, -366)) {
    return "bad-date";
  }
  const result = await setShopClosed(shop.id, date, off);
  refresh();
  return result;
}

/** Morning check on Today: the cash really in the drawer as today starts. */
export async function setTodayOpeningCash(rupees: string): Promise<"ok" | "bad-amount"> {
  const shop = await requireShop();
  const amount = rupees.trim() === "" ? 0 : parseRupeeInput(rupees);
  if (amount === null || amount < 0 || amount > MAX_ENTRY_AMOUNT) return "bad-amount";
  await setOpeningCash(shop.id, businessDate(), amount);
  refresh();
  return "ok";
}
