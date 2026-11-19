"use client";

import { useState } from "react";
import { useDayView, useShopSnapshot } from "@/client/localStore";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
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
import { cn } from "@/lib/cn";
import { formatRupees, parseRupeeInput } from "@/lib/money";
import { AddShell } from "./AddShell";
import { Keypad, QuickAdd } from "./Keypad";
import { MaterialDetails, draftToPurchase, emptyDraft } from "./MaterialDetails";
import { BillPanel } from "./BillPanel";
import { Footer, PaymentChoice } from "./FormParts";
import { OtherNote, mergeNoteHints } from "./OtherNote";
import { VoiceButton } from "./VoiceButton";
import { billTotal } from "@/domain/bill";
import { parseSpoken } from "@/domain/spoken";
import { useEntryEditor } from "./useEntryEditor";

export type FormProps = { existing: Entry | null; initialDate: BusinessDate; today: BusinessDate };

const rupeesText = (paise: number | undefined) => (paise ? String(paise / 100) : "");

// ---------- Sale ----------

/**
 * Add / edit a sale: a bill of items (v2 Phase 3) or a quick amount on the keypad.
 * "Bill each sale" shops start on the bill; an existing sale opens the way it was made.
 */
export function SaleForm({ existing, initialDate, today }: FormProps) {
  const t = useT();
  const snapshot = useShopSnapshot();
  const editor = useEntryEditor(existing, initialDate);
  const [payment, setPayment] = useState<PaymentMode>(existing?.paymentMode ?? "cash");
  const [chosen, setChosen] = useState<"bill" | "quick" | null>(
    existing ? (existing.lines ? "bill" : "quick") : null,
  );
  const how = chosen ?? (snapshot?.salesMode === "bills" ? "bill" : "quick");

  return (
    <AddShell
      type="sale"
      today={today}
      date={editor.date}
      onDateChange={editor.setDate}
      editing={!!existing}
    >
      <div
        role="radiogroup"
        aria-label={t("How to enter this sale")}
        className="grid grid-cols-2 gap-1 self-center rounded-full bg-surface p-1"
      >
        {(["bill", "quick"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={how === value}
            onClick={() => setChosen(value)}
            className={cn(
              "min-h-9 press rounded-full px-4 text-[13px]",
              how === value ? "glass-soft font-bold text-ink" : "font-semibold text-muted",
            )}
          >
            {value === "bill" ? t("Bill") : t("Quick amount")}
          </button>
        ))}
      </div>
      {how === "bill" ? (
        <BillPanel
          editor={editor}
          existing={existing}
          payment={payment}
          onPayment={setPayment}
          items={snapshot?.saleItems ?? snapshot?.close?.plateItems ?? []}
          shopName={snapshot?.shopName ?? ""}
        />
      ) : (
        <QuickSale editor={editor} existing={existing} payment={payment} onPayment={setPayment} />
      )}
    </AddShell>
  );
}

function QuickSale({
  editor,
  existing,
  payment,
  onPayment,
}: {
  editor: ReturnType<typeof useEntryEditor>;
  existing: Entry | null;
  payment: PaymentMode;
  onPayment: (mode: PaymentMode) => void;
}) {
  const t = useT();
  const snapshot = useShopSnapshot();
  // A bill switched to a quick amount keeps its total as the starting amount.
  const [digits, setDigits] = useState(rupeesText(existing?.amount));
  const amount = Number(digits || 0) * 100;
  const usual = snapshot?.quickAmounts ?? [];

  const heard = (text: string) => {
    const spoken = parseSpoken(text, snapshot?.saleItems ?? []);
    // "2 chai 1 samosa" with no amount: the items' prices add up to it.
    const total = spoken.amount ?? (spoken.lines.length > 0 ? billTotal(spoken.lines) : null);
    if (total) setDigits(String(Math.min(Math.floor(total / 100), 9_999_999)));
    if (spoken.payment) onPayment(spoken.payment);
  };

  return (
    <>
      <div className="flex flex-col items-center pt-1.5">
        <span className="text-[13px] text-muted">{t("Sale amount")}</span>
        <output aria-live="polite" className="font-display text-[52px] leading-tight font-bold">
          {formatRupees(amount)}
        </output>
      </div>
      <VoiceButton onHeard={heard} example={t("40 cash")} />
      {usual.length > 0 && (
        <div className="flex flex-col gap-1.5" data-no-swipe>
          <span className="text-xs font-semibold text-muted">{t("Your usual amounts")}</span>
          <div className="flex flex-wrap gap-2">
            {usual.map((paise) => (
              <button
                key={paise}
                type="button"
                aria-pressed={amount === paise}
                onClick={() => setDigits(String(paise / 100))}
                className={cn(
                  "min-h-11 min-w-16 press rounded-full border px-4 text-[15px] font-bold",
                  amount === paise
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-edge glass-soft text-ink",
                )}
              >
                {formatRupees(paise)}
              </button>
            ))}
          </div>
        </div>
      )}
      <QuickAdd value={digits} onChange={setDigits} />
      <PaymentChoice value={payment} onChange={onPayment} />
      <Keypad value={digits} onChange={setDigits} />
      <Footer
        editor={editor}
        canSave={amount > 0}
        label={t("Save sale")}
        onSave={() =>
          editor.save({
            type: "sale",
            amount,
            paymentMode: payment,
            category: null,
            paidFrom: null,
            lines: null,
          })
        }
        editing={!!existing}
      />
    </>
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
  const [note, setNote] = useState(existing?.note ?? "");
  const snapshot = useShopSnapshot();
  // Today's expenses on this phone, so a note typed earlier today is offered even offline.
  const todays = useDayView(today).entries.filter((e) => e.type === "expense");
  const noteHints = mergeNoteHints(snapshot?.expenseNotes ?? [], todays);
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
      <VoiceButton
        example={t("gas 900 from pocket")}
        onHeard={(heardText) => {
          const spoken = parseSpoken(heardText);
          if (spoken.amount) setText(String(spoken.amount / 100));
          if (spoken.category) setCategory(spoken.category);
          if (spoken.paidFrom) setPaidFrom(spoken.paidFrom);
          if (spoken.note) setNote(spoken.note);
        }}
      />
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
      {category === "other" && (
        <OtherNote
          value={note}
          onChange={setNote}
          hints={noteHints}
          onPickAmount={(paise) => {
            if (!text.trim()) setText(rupeesText(paise));
          }}
        />
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
            note: category === "other" ? note.trim() || null : null,
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
