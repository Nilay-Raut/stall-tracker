"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { workOutMargin } from "@/domain/itemMargin";
import { msg } from "@/i18n/translate";
import { parseRupeeInput } from "@/lib/money";
import { MAX_ITEMS, createItem, getItem, listItems, removeItem, updateItem } from "@/server/items";
import { requireShop } from "@/server/queries/shop";
import { type FormState, fieldErrorsFrom } from "./formState";

const MAX_PRICE = 10_000_00; // ₹10,000 for one plate

const rupees = (message: string) =>
  z.string().transform((value, ctx) => {
    const paise = parseRupeeInput(value);
    if (paise === null || paise > MAX_PRICE) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return paise;
  });

const itemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, msg("Name the item."))
    .max(40, msg("Keep the name under 40 letters.")),
  price: rupees(msg("Enter the selling price, like 60.")).refine(
    (p) => p > 0,
    msg("The price must be more than ₹0."),
  ),
  basis: z.enum(["cost", "margin", "percent"]),
  value: z.string().trim(),
});

export async function saveItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const shop = await requireShop();
  const id = String(formData.get("id") ?? "new");
  const field = (name: string) => String(formData.get(name) ?? "");

  const parsed = itemSchema.safeParse({
    name: field("name"),
    price: field("price"),
    basis: field("basis"),
    value: field("value"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { name, price, basis, value } = parsed.data;

  // The value is rupees for cost and margin, a percentage for percent.
  const amount = basis === "percent" ? Number(value) : parseRupeeInput(value);
  if (amount === null || !Number.isFinite(amount) || value === "" || amount > MAX_PRICE) {
    return { fieldErrors: { value: msg("Enter a number, like 24.") } };
  }
  const { cost } = workOutMargin(price, basis, amount);
  if (cost < 0) {
    return { fieldErrors: { value: msg("That would make the cost less than ₹0.") } };
  }

  if (id === "new") {
    if ((await listItems(shop.id)).length >= MAX_ITEMS) {
      return { error: msg("Up to 30 items.") };
    }
    await createItem(shop.id, { name, price, cost });
  } else {
    if (!(await getItem(shop.id, id))) return { error: msg("This item no longer exists.") };
    await updateItem(shop.id, id, { name, price, cost });
  }
  redirect("/settings/items");
}

export async function deleteItem(id: string): Promise<void> {
  const shop = await requireShop();
  if (await getItem(shop.id, id)) await removeItem(shop.id, id);
  redirect("/settings/items");
}
