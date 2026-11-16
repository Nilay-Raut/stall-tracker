"use server";

import { refresh } from "next/cache";
import { msg } from "@/i18n/translate";
import { monthOf } from "@/lib/calendar";
import { businessDate } from "@/lib/dates";
import { parseRupeeInput } from "@/lib/money";
import { requireShop } from "@/server/queries/shop";
import { setTarget } from "@/server/target";
import type { FormState } from "./formState";

const MAX_TARGET = 1_00_00_000_00; // ₹1 crore

/** Sets this month's profit target. */
export async function saveTarget(prev: FormState, formData: FormData): Promise<FormState> {
  const shop = await requireShop();
  const target = parseRupeeInput(String(formData.get("target") ?? ""));
  if (target === null || target <= 0 || target > MAX_TARGET) {
    return {
      fieldErrors: { target: msg("Enter the profit you want this month, like 80000.") },
      values: prev.values, // keep the last save's marker so the form stays open
    };
  }
  await setTarget(shop.id, monthOf(businessDate()), target);
  refresh();
  return { values: { saved: String(Date.now()) } };
}
