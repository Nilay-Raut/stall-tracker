"use client";

import { useState } from "react";
import { useShopSnapshot } from "@/client/localStore";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { FormError } from "@/components/ui/FormError";
import { MoneyInput } from "@/components/ui/MoneyInput";
import {
  EXPENSE_CATEGORIES,
  type Entry,
  type ExpenseCategory,
  MAX_ENTRY_AMOUNT,
  PAID_FROM,
  type PaidFrom,
  type PaymentMode,
} from "@/domain/entry";
import { useT } from "@/i18n/client";
import type { BusinessDate } from "@/lib/dates";
import { CATEGORY_LABELS, PAID_FROM_LABELS } from "@/lib/labels";
import { formatRupees, parseRupeeInput } from "@/lib/money";
import { AddShell } from "./AddShell";
import { Keypad, QuickAdd } from "./Keypad";
import { MaterialDetails, draftToPurchase, emptyDraft } from "./MaterialDetails";
import { useEntryEditor } from "./useEntryEditor";

export type FormProps = { existing: Entry | null; initialDate: BusinessDate; today: BusinessDate };

const rupeesText = (paise: number | undefined) => (paise ? String(paise / 100) : "");

// ---------- Sale ----------

export function SaleForm({ existing, initialDate, today }: FormProps) {
  const t = useT();
  const editor = useEntryEditor(existing, initialDate);
  const [digits, setDigits] = useState(rupeesText(existing?.amount));
  const [mode, setMode] = useState<PaymentMode>(existing?.paymentMode ?? "cash");
  const amount = Number(digits || 0) * 100;

  return (
    <AddShell
      type="sale"
      today={today}
      date={editor.date}
      onDateChange={editor.setDate}
      editing={!!existing}
    >
      <div className="flex flex-col items-center pt-1.5">
        <span className="text-[13px] text-muted">{t("Sale amount")}</span>
        <output aria-live="polite" className="font-display text-[52px] leading-tight font-bold">
          {formatRupees(amount)}
        </output>
      </div>
      <QuickAdd value={digits} onChange={setDigits} />
      <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={t("Paid by")}>
        {(["cash", "upi"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={
              mode === m
                ? "h-14 rounded-card border-[1.5px] border-accent bg-accent text-[17px] font-bold text-accent-ink"
                : "h-14 rounded-card border-[1.5px] border-ink bg-white text-[17px] font-bold"
            }
          >
            {m === "cash" ? t("Cash") : "UPI"}
          </button>
        ))}
      </div>
      <Keypad value={digits} onChange={setDigits} />
      <Footer
        editor={editor}
        canSave={amount > 0}
        label={t("Save sale")}
        onSave={() =>
          editor.save({ type: "sale", amount, paymentMode: mode, category: null, paidFrom: null })
        }
        editing={!!existing}
      />
    </AddShell>
  );
}

// ---------- Expense ----------

export function ExpenseForm({ existing, initialDate, today }: FormProps) {
  const t = useT();
  const editor = useEntryEditor(existing, initialDate);
  const [text, setText] = useState(rupeesText(existing?.amount));
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? "raw_material");
  const [paidFrom, setPaidFrom] = useState<PaidFrom>(existing?.paidFrom ?? "drawer");
  const [material, setMaterial] = useState(() => emptyDraft(existing?.purchase ?? null));
  const snapshot = useShopSnapshot();
  const amount = parseRupeeInput(text);
  const tooBig = amount !== null && amount > MAX_ENTRY_AMOUNT;
  const bought = draftToPurchase(material);
  const categoryChoices = EXPENSE_CATEGORIES.map((value) => ({
    value,
    label: t(CATEGORY_LABELS[value]),
  }));
  const paidFromChoices = PAID_FROM.map((value) => ({ value, label: t(PAID_FROM_LABELS[value]) }));

  return (
    <AddShell
      type="expense"
      today={today}
      date={editor.date}
      onDateChange={editor.setDate}
      editing={!!existing}
    >
      <MoneyInput
        label={t("Amount")}
        name="amount"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="0"
        error={
          text && amount === null
            ? t("Enter an amount like 775 or 775.50")
            : tooBig
              ? t("That is too much for one entry.")
              : undefined
        }
        autoFocus={!existing}
      />
      <ChoiceGroup
        label={t("Category")}
        choices={categoryChoices}
        value={category}
        onChange={setCategory}
        tone="accent"
      />
      {category === "salary" && (
        <p className="-mt-1 text-xs text-muted">
          {t("Only daily wages here. A monthly salary belongs in Settings, under fixed costs.")}
        </p>
      )}
      <ChoiceGroup
        label={t("Paid from")}
        choices={paidFromChoices}
        value={paidFrom}
        onChange={setPaidFrom}
      />
      {category !== "salary" && (
        <MaterialDetails
          draft={material}
          onChange={setMaterial}
          amount={amount}
          hints={snapshot?.materials ?? []}
          suppliers={snapshot?.suppliers ?? []}
          error={bought.error}
        />
      )}
      <Footer
        editor={editor}
        canSave={!!amount && !tooBig && (category === "salary" || !bought.error)}
        label={t("Save expense")}
        onSave={() =>
          amount &&
          editor.save({
            type: "expense",
            amount,
            paymentMode: null,
            category,
            paidFrom,
            purchase: category === "salary" ? null : bought.purchase,
          })
        }
        editing={!!existing}
      />
    </AddShell>
  );
}

// ---------- Cash out ----------

export function CashOutForm({ existing, initialDate, today }: FormProps) {
  const t = useT();
  const editor = useEntryEditor(existing, initialDate);
  const [text, setText] = useState(rupeesText(existing?.amount));
  const amount = parseRupeeInput(text);
  const tooBig = amount !== null && amount > MAX_ENTRY_AMOUNT;

  return (
    <AddShell
      type="cash_out"
      today={today}
      date={editor.date}
      onDateChange={editor.setDate}
      editing={!!existing}
    >
      <MoneyInput
        label={t("Cash taken out of the drawer")}
        name="amount"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="0"
        hint={t("Money you take for yourself. It is not an expense, so profit stays the same.")}
        error={
          text && amount === null
            ? t("Enter an amount like 500")
            : tooBig
              ? t("That is too much for one entry.")
              : undefined
        }
        autoFocus={!existing}
      />
      <Footer
        editor={editor}
        canSave={!!amount && !tooBig}
        label={t("Save cash out")}
        onSave={() =>
          amount &&
          editor.save({
            type: "cash_out",
            amount,
            paymentMode: null,
            category: null,
            paidFrom: null,
          })
        }
        editing={!!existing}
      />
    </AddShell>
  );
}

// ---------- Shared bottom ----------

function Footer({
  editor,
  canSave,
  label,
  onSave,
  editing,
}: {
  editor: ReturnType<typeof useEntryEditor>;
  canSave: boolean;
  label: string;
  onSave: () => void;
  editing: boolean;
}) {
  const t = useT();
  return (
    <div className="mt-auto flex flex-col gap-1.5 pt-2">
      <FormError message={editor.error ?? undefined} />
      <Button size="lg" disabled={!canSave || editor.busy} onClick={onSave}>
        {label}
      </Button>
      {editing && (
        <Button variant="ghost" disabled={editor.busy} onClick={() => void editor.remove()}>
          {t("Delete entry")}
        </Button>
      )}
    </div>
  );
}
