"use server";

import { redirect } from "next/navigation";
import { computeClose } from "@/domain/dayClose";
import { msg } from "@/i18n/translate";
import { DRAWER_SHORT, readCloseForm } from "@/lib/closeForm";
import { businessDate, shiftDate } from "@/lib/dates";
import { getCloseContext, saveClose } from "@/server/days";
import { requireShop } from "@/server/queries/shop";
import type { FormState } from "./formState";

/** Closes (or re-closes) a day from the Close day form, with the server's own data. */
export async function closeDay(_prev: FormState, formData: FormData): Promise<FormState> {
  const shop = await requireShop();
  const date = String(formData.get("date") ?? "");
  const today = businessDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today || date < shiftDate(today, -366)) {
    return { error: msg("That date cannot be closed.") };
  }

  // Check against the entries the server has now, not what the form was shown.
  const context = await getCloseContext(shop, date);
  const read = readCloseForm(
    formData,
    context.plateItems.map((i) => i.id),
  );
  if ("fieldErrors" in read) return { fieldErrors: read.fieldErrors };

  const result = computeClose(context.entered, read.ok.input);
  if (result.cashSales < 0) return { fieldErrors: { countedCash: DRAWER_SHORT } };

  await saveClose(shop.id, date, read.ok.input, read.ok.plateCounts);
  redirect(`/summary/${date}`);
}
