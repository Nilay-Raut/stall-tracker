"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { businessDate, shiftDate } from "@/lib/dates";
import { type MarkOffResult, setShopClosed } from "@/server/days";
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
