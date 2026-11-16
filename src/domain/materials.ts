import { type Translate, english, msg } from "@/i18n/translate";
import type { BusinessDate } from "@/lib/dates";
import type { Paise } from "@/lib/money";

/** Units offered when entering a purchase (any other word is allowed too). */
export const COMMON_UNITS = ["kg", "litre", "gram", "piece", "packet", "dozen", "bottle"] as const;

const UNIT_NAMES: Record<string, string> = {
  kg: msg("kg"),
  litre: msg("litre"),
  gram: msg("gram"),
  piece: msg("piece"),
  packet: msg("packet"),
  dozen: msg("dozen"),
  bottle: msg("bottle"),
};

/** A unit in the app's language: the common units are translated, others shown as typed. */
export function unitName(unit: string, t: Translate = english): string {
  const known = UNIT_NAMES[unit.trim().toLowerCase()];
  const translated = known ? t(known) : known;
  return translated && translated !== known ? translated : unit; // English: as typed
}

/** Rule 12: price per unit, in whole paise. */
export function purchaseRate(amount: Paise, quantity: number): Paise {
  return Math.round(amount / quantity);
}

/** Quantity as whole thousandths, as stored (2.5 kg -> 2500). */
export const toMilli = (quantity: number) => Math.round(quantity * 1000);
export const fromMilli = (milli: number) => milli / 1000;

/** What the phone knows about a material from earlier purchases. */
export type MaterialHint = {
  name: string;
  unit: string;
  lastRate: Paise;
  lastSupplier: string | null;
  lastDate: BusinessDate;
};

/** Finds a material by name, ignoring case and extra spaces. */
export function findMaterial(
  hints: ReadonlyArray<MaterialHint>,
  name: string,
): MaterialHint | undefined {
  const key = name.trim().toLowerCase();
  return key ? hints.find((h) => h.name.toLowerCase() === key) : undefined;
}

/** The yellow note under material details: "Rate ₹155 a litre" + comparison with last time. */
export function rateNote(
  rate: Paise,
  unit: string,
  last: MaterialHint | undefined,
  format: (paise: Paise) => string,
  t: Translate = english,
): { title: string; detail: string | null } {
  const title = t("Rate {rate} a {unit}", { rate: format(rate), unit: unitName(unit, t) });
  if (!last || last.unit !== unit.trim().toLowerCase()) return { title, detail: null };

  const from = `(${format(last.lastRate)}${last.lastSupplier ? `, ${last.lastSupplier}` : ""})`;
  const difference = rate - last.lastRate;
  if (difference === 0) return { title, detail: t("Same as your last purchase {from}.", { from }) };
  const values = { amount: format(Math.abs(difference)), from };
  return {
    title,
    detail:
      difference > 0
        ? t("{amount} more than your last purchase {from}.", values)
        : t("{amount} less than your last purchase {from}.", values),
  };
}
