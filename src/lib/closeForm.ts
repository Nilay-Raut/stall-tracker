import { z } from "zod";
import type { CloseInput } from "@/domain/dayClose";
import { msg } from "@/i18n/translate";
import { parseRupeeInput } from "./money";

/** What the Close day form sends, checked. Used by the server and by offline closing. */
export type CloseSubmission = {
  date: string;
  input: CloseInput;
  /** Null when plates are not counted ("Skip today", or no items). */
  plateCounts: Array<{ itemId: string; quantity: number }> | null;
};

const MAX = 1_00_00_000_00; // ₹1 crore, a sanity limit
const MAX_PLATES = 9999;

const money = (message: string) =>
  z.string().transform((value, ctx) => {
    const paise = parseRupeeInput(value);
    if (paise === null || paise > MAX) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return paise;
  });

const optionalMoney = (message: string) =>
  z.string().transform((value, ctx) => {
    if (value.trim() === "") return null;
    const paise = parseRupeeInput(value);
    if (paise === null || paise > MAX) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return paise;
  });

const closeSchema = z.object({
  date: z.iso.date(),
  openingCash: money(msg("Enter the cash you started the day with.")),
  countedCash: money(msg("Count the cash in the drawer and enter it.")),
  upiTotal: money(msg("Enter today's UPI total (0 if none).")),
  waste: optionalMoney(msg("Enter an amount like 140, or leave it empty.")),
});

/** Reads and checks the form. Plate counts are only taken for the given item ids. */
export function readCloseForm(
  formData: FormData,
  plateItemIds: ReadonlyArray<string>,
): { ok: CloseSubmission } | { fieldErrors: Record<string, string> } {
  const field = (name: string) => String(formData.get(name) ?? "");
  const parsed = closeSchema.safeParse({
    date: field("date"),
    openingCash: field("openingCash"),
    countedCash: field("countedCash"),
    upiTotal: field("upiTotal"),
    waste: field("waste"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  const { date, ...input } = parsed.data;
  const skipped = plateItemIds.length === 0 || formData.get("platesSkipped") === "1";
  const plateCounts = skipped
    ? null
    : plateItemIds.map((itemId) => {
        const quantity = Number(formData.get(`plate-${itemId}`) ?? 0);
        return {
          itemId,
          quantity: Number.isInteger(quantity) ? Math.min(Math.max(quantity, 0), MAX_PLATES) : 0,
        };
      });
  return { ok: { date, input, plateCounts } };
}

export const DRAWER_SHORT = msg(
  "The drawer has less than you started with. Check the amounts, or add a missing expense or cash taken out.",
);
