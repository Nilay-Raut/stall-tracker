import { type Translate, english } from "@/i18n/translate";
import { type BusinessDate, type Lang, formatWeekday } from "./dates";
import { type Paise, formatRupees, formatSignedRupees } from "./money";

export type SummaryNote = { label: string; value: string };

type Input = {
  /** Drawer cash sales − entered cash sales; null when no cash sales were entered. */
  cashDifference: Paise | null;
  cashOut: Paise;
  waste: Paise | null;
  cashLeft: Paise;
  sales: Paise;
  lastWeek: { date: BusinessDate; sales: Paise } | null;
};

/** The "Things to know" list on the day summary, in the wireframe's order. */
export function summaryNotes(
  input: Input,
  t: Translate = english,
  lang: Lang = "en",
): SummaryNote[] {
  const notes: SummaryNote[] = [];

  if (input.cashDifference !== null) {
    const d = input.cashDifference;
    notes.push(
      d === 0
        ? { label: t("Cash check: drawer matches your entries"), value: t("OK") }
        : {
            label:
              d > 0
                ? t("Cash check: more in drawer than recorded")
                : t("Cash check: less in drawer than recorded"),
            value: formatSignedRupees(d),
          },
    );
  }
  if (input.cashOut > 0) {
    notes.push({ label: t("Cash taken out by owner"), value: formatRupees(input.cashOut) });
  }
  if (input.waste) {
    notes.push({ label: t("Food wasted"), value: formatRupees(input.waste) });
  }
  notes.push({ label: t("Cash left for tomorrow"), value: formatRupees(input.cashLeft) });

  if (input.lastWeek) {
    const change = input.sales - input.lastWeek.sales;
    notes.push({
      label: t("Last {weekday} sales were {amount}", {
        weekday: formatWeekday(input.lastWeek.date, lang),
        amount: formatRupees(input.lastWeek.sales),
      }),
      value:
        change === 0
          ? t("Same")
          : change > 0
            ? t("{amount} more", { amount: formatRupees(change) })
            : t("{amount} less", { amount: formatRupees(-change) }),
    });
  }
  return notes;
}
