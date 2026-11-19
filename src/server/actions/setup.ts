"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SALES_MODES } from "@/domain/entry";
import { msg } from "@/i18n/translate";
import { businessDate } from "@/lib/dates";
import { parseRupeeInput } from "@/lib/money";
import { requireUser } from "@/server/auth/currentUser";
import { getDb } from "@/server/db/client";
import { fixedCosts, shops } from "@/server/db/schema";
import { recomputeMonth } from "@/server/entries";
import { type FormState, fieldErrorsFrom } from "./formState";

const MAX_AMOUNT = 1_00_00_000_00; // ₹1 crore in paise, a sanity limit
const MAX_COSTS = 20;

const amount = (message: string, { allowZero }: { allowZero: boolean }) =>
  z.string().transform((value, ctx) => {
    const paise = value.trim() === "" && allowZero ? 0 : parseRupeeInput(value);
    if (paise === null || paise > MAX_AMOUNT || (!allowZero && paise === 0)) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return paise;
  });

const setupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, msg("Enter your shop name."))
    .max(60, msg("Keep the name under 60 letters.")),
  language: z.enum(["en", "hi", "mr"]),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, msg("Pick a closing time.")),
  openingCash: amount(msg("Enter the cash you start the day with."), { allowZero: true }),
  salesMode: z.enum(SALES_MODES),
  // Missing (a form from before this switch): keep taking fixed costs out, as before.
  fixedCostInDailyProfit: z
    .enum(["1", "0"])
    .default("1")
    .transform((value) => value === "1"),
  costs: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, msg("Name this cost."))
          .max(40, msg("Keep it under 40 letters.")),
        amount: amount(msg("Enter the monthly amount."), { allowZero: false }),
      }),
    )
    .max(MAX_COSTS, msg("Up to 20 fixed costs.")),
});

/** Pairs up the cost rows, dropping rows left completely empty. */
function readCosts(formData: FormData) {
  const names = formData.getAll("costName").map(String);
  const amounts = formData.getAll("costAmount").map(String);
  return names
    .map((name, i) => ({ name, amount: amounts[i] ?? "" }))
    .filter((row) => row.name.trim() !== "" || row.amount.trim() !== "");
}

export async function saveSetup(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = setupSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    language: formData.get("language"),
    closingTime: String(formData.get("closingTime") ?? ""),
    openingCash: String(formData.get("openingCash") ?? ""),
    salesMode: formData.get("salesMode"),
    fixedCostInDailyProfit: formData.get("fixedInDailyProfit") ?? undefined,
    costs: readCosts(formData),
  });
  if (!parsed.success) {
    return { error: msg("Some details need fixing."), fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { costs, openingCash, ...details } = parsed.data;
  const shopValues = { ...details, defaultOpeningCash: openingCash };

  await getDb().transaction(async (tx) => {
    const [shop] = await tx
      .insert(shops)
      .values({ ownerId: user.id, ...shopValues })
      .onConflictDoUpdate({ target: shops.ownerId, set: shopValues })
      .returning({ id: shops.id });

    // The list is small, so replacing it whole is simpler than diffing rows.
    await tx.delete(fixedCosts).where(eq(fixedCosts.shopId, shop.id));
    if (costs.length > 0) {
      await tx.insert(fixedCosts).values(
        costs.map((cost, i) => ({
          shopId: shop.id,
          name: cost.name,
          monthlyAmount: cost.amount,
          sortOrder: i,
        })),
      );
    }

    // This month's days use the new fixed costs straight away (past months keep theirs).
    await recomputeMonth(tx, shop.id, businessDate().slice(0, 7));
  });

  redirect("/");
}
