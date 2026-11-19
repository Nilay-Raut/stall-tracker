"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { FormError } from "@/components/ui/FormError";
import { TextField } from "@/components/ui/TextField";
import { fixedCostPerDay } from "@/domain/fixedCosts";
import { cn } from "@/lib/cn";
import { formatRupees, parseRupeeInput } from "@/lib/money";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { initialFormState } from "@/server/actions/formState";
import { saveSetup } from "@/server/actions/setup";
import type { SalesMode } from "@/domain/entry";

type Language = "en" | "hi" | "mr";
type CostRow = { key: string; name: string; amount: string };

export type SetupValues = {
  name: string;
  language: Language;
  closingTime: string;
  openingCash: string;
  salesMode: SalesMode;
  costs: Array<{ name: string; amount: string }>;
  /** Take the day's share of the fixed costs out of the profit on Today. */
  fixedInDailyProfit: boolean;
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
  { value: "mr", label: "मराठी" },
] as const;

const SALES_MODES: ReadonlyArray<{ value: SalesMode; title: string; body: string }> = [
  { value: "totals", title: msg("Totals only"), body: msg("Enter cash and UPI at closing.") },
  {
    value: "totals_items",
    title: msg("Totals + item count"),
    body: msg("Also count plates of main items. Can be skipped any day."),
  },
  {
    value: "bills",
    title: msg("Bill each sale"),
    body: msg("Tap the items for every sale. See what sells best; send bills on WhatsApp."),
  },
];

const PLACEHOLDERS = [msg("Rent"), msg("Salary (monthly helper)"), msg("Electricity")];

const isFilled = (row: CostRow) => row.name.trim() !== "" || row.amount.trim() !== "";

let nextKey = 0;
const newRow = (name = "", amount = ""): CostRow => ({ key: `row-${nextKey++}`, name, amount });

type Props = {
  initial: SetupValues;
  isFirstSetup: boolean;
  daysInMonth: number;
  /** Number of items, or null during first setup (items come after the shop exists). */
  itemCount: number | null;
};

export function SetupForm({ initial, isFirstSetup, daysInMonth, itemCount }: Props) {
  const t = useT();
  const [state, formAction, pending] = useActionState(saveSetup, initialFormState);
  const errors = state.fieldErrors ?? {};

  // Controlled fields, so nothing typed is lost when the server sends back an error.
  const [name, setName] = useState(initial.name);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [closingTime, setClosingTime] = useState(initial.closingTime);
  const [openingCash, setOpeningCash] = useState(initial.openingCash);
  const [salesMode, setSalesMode] = useState<SalesMode>(initial.salesMode);
  const [fixedInDailyProfit, setFixedInDailyProfit] = useState(initial.fixedInDailyProfit);
  const [costs, setCosts] = useState<CostRow[]>(() =>
    initial.costs.length > 0
      ? initial.costs.map((c) => newRow(c.name, c.amount))
      : PLACEHOLDERS.map(() => newRow()),
  );

  const updateCost = (key: string, patch: Partial<CostRow>) =>
    setCosts((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const monthly = costs.reduce((sum, row) => sum + (parseRupeeInput(row.amount) ?? 0), 0);

  // The server skips empty rows, so its error positions count only filled-in rows.
  const rowErrors = costs.map((row, i) => {
    if (!isFilled(row)) return {};
    const position = costs.slice(0, i).filter(isFilled).length;
    return {
      name: errors[`costs.${position}.name`],
      amount: errors[`costs.${position}.amount`],
    };
  });

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormError message={state.error} />

      <TextField
        label={t("Shop name")}
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("My Stall")}
        maxLength={60}
        error={errors.name}
        required
      />

      <ChoiceGroup
        label={t("Language")}
        name="language"
        choices={LANGUAGES}
        value={language}
        onChange={setLanguage}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <TextField
          label={t("Closing time")}
          name="closingTime"
          type="time"
          value={closingTime}
          onChange={(e) => setClosingTime(e.target.value)}
          error={errors.closingTime}
          required
        />
        <TextField
          label={t("Opening cash (₹)")}
          name="openingCash"
          inputMode="decimal"
          value={openingCash}
          onChange={(e) => setOpeningCash(e.target.value)}
          placeholder="1000"
          error={errors.openingCash}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-xs font-semibold text-muted">
          {t("How do you want to enter sales?")}
        </legend>
        {SALES_MODES.map((mode) => {
          const isOn = salesMode === mode.value;
          return (
            <label
              key={mode.value}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-card border px-3.5 py-3",
                isOn ? "border-accent bg-accent text-accent-ink" : "border-edge bg-field",
              )}
            >
              <input
                type="radio"
                name="salesMode"
                value={mode.value}
                checked={isOn}
                onChange={() => setSalesMode(mode.value)}
                className="sr-only"
              />
              <span className="text-[15px] font-bold">{t(mode.title)}</span>
              <span className={cn("text-xs", isOn ? "text-accent-ink" : "text-muted")}>
                {t(mode.body)}
              </span>
            </label>
          );
        })}
      </fieldset>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">{t("Fixed costs per month")}</h2>
          <button
            type="button"
            onClick={() => setCosts((rows) => [...rows, newRow()])}
            disabled={costs.length >= 20}
            className="min-h-11 px-1 text-[13px] font-bold underline disabled:opacity-40"
          >
            {t("+ Add cost")}
          </button>
        </div>
        <p className="text-xs text-muted">
          {t("Pay a helper monthly? Add it here. Daily wages go in as an expense on the day.")}
        </p>

        {costs.map((row, i) => (
          <div
            key={row.key}
            className="grid grid-cols-[minmax(0,1fr)_6.5rem_2.75rem] items-start gap-2"
          >
            <TextField
              label={t("Cost {n} name", { n: i + 1 })}
              id={`cost-${i}-name`}
              name="costName"
              value={row.name}
              onChange={(e) => updateCost(row.key, { name: e.target.value })}
              placeholder={t(PLACEHOLDERS[i] ?? msg("Name"))}
              maxLength={40}
              error={rowErrors[i].name}
              className="h-11"
            />
            <TextField
              label={t("₹ a month")}
              id={`cost-${i}-amount`}
              name="costAmount"
              inputMode="decimal"
              value={row.amount}
              onChange={(e) => updateCost(row.key, { amount: e.target.value })}
              placeholder="0"
              error={rowErrors[i].amount}
              className="h-11"
            />
            <button
              type="button"
              aria-label={t("Remove cost {n}", { n: i + 1 })}
              onClick={() => setCosts((rows) => rows.filter((r) => r.key !== row.key))}
              className="mt-6 h-11 rounded-control border border-edge text-lg"
            >
              ×
            </button>
          </div>
        ))}

        <div className="flex items-baseline justify-between border-t border-line pt-2">
          <span className="text-[15px] font-bold">
            {t("{amount} a month", { amount: formatRupees(monthly) })}
          </span>
          <span className="text-sm text-muted">
            {t("= {amount} a day", {
              amount: formatRupees(fixedCostPerDay(monthly, daysInMonth)),
            })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="flex flex-col">
            <span id="fixed-daily-label" className="text-[15px] font-semibold">
              {t("Take them out of each day's profit")}
            </span>
            <span className="text-xs text-muted">
              {fixedInDailyProfit
                ? t("Today shows profit after the day's share of fixed costs.")
                : t(
                    "Today shows sales minus expenses only. Reports and Target still count fixed costs.",
                  )}
            </span>
          </span>
          <input type="hidden" name="fixedInDailyProfit" value={fixedInDailyProfit ? "1" : "0"} />
          <button
            type="button"
            role="switch"
            aria-checked={fixedInDailyProfit}
            aria-labelledby="fixed-daily-label"
            onClick={() => setFixedInDailyProfit((on) => !on)}
            className={cn(
              "relative h-8 w-14 shrink-0 rounded-full",
              fixedInDailyProfit ? "bg-accent" : "bg-track",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-6 rounded-full bg-white transition-all",
                fixedInDailyProfit ? "left-7" : "left-1",
              )}
            />
          </button>
        </div>
      </Card>

      {itemCount === null ? (
        <Card tone="dashed" className="flex-row items-center justify-between">
          <span className="text-[15px] font-semibold">{t("Items and margins")}</span>
          <span className="text-xs text-muted">{t("Add your items after saving")}</span>
        </Card>
      ) : (
        <Link
          href="/settings/items"
          className="flex min-h-14 items-center justify-between rounded-card border border-edge px-3.5"
        >
          <span className="text-[15px] font-semibold">{t("Items and margins")}</span>
          <span className="text-sm text-muted">
            {itemCount === 1 ? t("1 item ›") : t("{n} items ›", { n: itemCount })}
          </span>
        </Link>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("Saving…") : isFirstSetup ? t("Save and start") : t("Save")}
      </Button>
    </form>
  );
}
