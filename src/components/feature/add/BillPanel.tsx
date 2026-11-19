"use client";

import { MessageCircle, Minus, Plus, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { billMessage, billQuantity, billTotal, whatsAppLink } from "@/domain/bill";
import {
  type Entry,
  MAX_BILL_LINES,
  MAX_LINE_QUANTITY,
  type PaymentMode,
  type SaleLine,
} from "@/domain/entry";
import { useLang, useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { formatDayLabel, formatTime } from "@/lib/dates";
import { type Paise, formatRupees, parseRupeeInput } from "@/lib/money";
import { Footer, PaymentChoice } from "./FormParts";
import type { useEntryEditor } from "./useEntryEditor";
import { VoiceButton } from "./VoiceButton";
import { pickSpoken } from "@/domain/spoken";

type Item = { id: string; name: string; price: Paise };
type Line = SaleLine & { key: string };

/** Most for one custom item (same limit as the server's check). */
const MAX_UNIT_PRICE: Paise = 1_00_000_00;
/** Above this many items, a search box helps. */
const SEARCH_FROM = 9;

type Props = {
  editor: ReturnType<typeof useEntryEditor>;
  existing: Entry | null;
  payment: PaymentMode;
  onPayment: (mode: PaymentMode) => void;
  /** The shop's items, from the phone's storage (works offline). */
  items: ReadonlyArray<Item>;
  shopName: string;
};

/** A sale made of items: tap saved items, add custom ones, then save (and send on WhatsApp). */
export function BillPanel({ editor, existing, payment, onPayment, items, shopName }: Props) {
  const t = useT();
  const lang = useLang();
  const [lines, setLines] = useState<Line[]>(() =>
    (existing?.lines ?? []).map((line, i) => ({ ...line, key: line.itemId ?? `custom-${i}` })),
  );
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState("");
  const customSheet = useRef<HTMLDialogElement>(null);

  const total = billTotal(lines);
  const count = billQuantity(lines);
  const full = lines.length >= MAX_BILL_LINES;
  const quantityOf = (itemId: string) => lines.find((l) => l.itemId === itemId)?.quantity ?? 0;

  const change = (key: string, by: number) =>
    setLines((all) =>
      all
        .map((l) =>
          l.key === key
            ? { ...l, quantity: Math.min(Math.max(l.quantity + by, 0), MAX_LINE_QUANTITY) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );

  const addItem = (item: Item) => {
    if (lines.some((l) => l.itemId === item.id)) return change(item.id, 1);
    if (full) return;
    setLines((all) => [
      ...all,
      { key: item.id, itemId: item.id, name: item.name, unitPrice: item.price, quantity: 1 },
    ]);
  };

  const addCustom = (line: SaleLine) =>
    setLines((all) => [...all, { ...line, key: `custom-${crypto.randomUUID()}` }]);

  // "2 chai 1 samosa UPI": adds the items named, with how many of each.
  const heard = (guesses: string[]) => {
    const found = pickSpoken(guesses, items, (s) => s.lines.length > 0);
    if (!found) return null;
    const { spoken } = found;
    if (spoken.payment) onPayment(spoken.payment);
    setLines((all) => {
      let next = [...all];
      for (const line of spoken.lines) {
        const have = next.find((l) => l.itemId === line.itemId);
        if (have) {
          next = next.map((l) =>
            l === have
              ? { ...l, quantity: Math.min(l.quantity + line.quantity, MAX_LINE_QUANTITY) }
              : l,
          );
        } else if (next.length < MAX_BILL_LINES) {
          next.push({ ...line, key: line.itemId ?? `custom-${crypto.randomUUID()}` });
        }
      }
      return next;
    });
    return found.text;
  };

  const shown = query.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  const toSave = () => ({
    type: "sale" as const,
    amount: total,
    paymentMode: payment,
    category: null,
    paidFrom: null,
    lines: lines.map((l): SaleLine => ({
      itemId: l.itemId,
      name: l.name,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    })),
  });

  const message = billMessage({
    shopName,
    when: `${formatDayLabel(editor.date, lang)} · ${formatTime(existing?.occurredAt ?? new Date().toISOString(), lang)}`,
    lines,
    paidBy: payment === "upi" ? t("Paid by UPI") : t("Paid in cash"),
    totalLabel: t("Total"),
    thanks: t("Thank you! Please visit again."),
  });

  return (
    <>
      <div className="flex flex-col items-center">
        <span className="text-[13px] text-muted">
          {count === 0
            ? t("Bill total")
            : count === 1
              ? t("Bill total · 1 item")
              : t("Bill total · {n} items", { n: count })}
        </span>
        <output aria-live="polite" className="font-display text-[48px] leading-tight font-bold">
          {formatRupees(total)}
        </output>
      </div>
      {items.length > 0 && <VoiceButton onHeard={heard} example={t("2 chai 1 samosa UPI")} />}

      {items.length >= SEARCH_FROM && (
        <label className="flex h-11 items-center gap-2 rounded-full glass-soft px-4">
          <Search size={16} aria-hidden className="text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Find an item")}
            aria-label={t("Find an item")}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </label>
      )}

      {items.length === 0 ? (
        <p className="rounded-card glass-soft px-4 py-3 text-sm text-muted">
          {t("No items yet.")}{" "}
          <AppLink href="/settings/items" className="font-semibold text-ink underline">
            {t("Add your items")}
          </AppLink>{" "}
          {t("to tap them here, or add a custom item below.")}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("Items")}>
          {shown.map((item) => {
            const quantity = quantityOf(item.id);
            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => addItem(item)}
                  disabled={quantity === 0 && full}
                  className={cn(
                    "flex min-h-[76px] w-full press flex-col items-start justify-between rounded-control p-2.5 text-left",
                    quantity > 0
                      ? "bg-accent-soft ring-2 ring-accent"
                      : "glass-soft disabled:opacity-40",
                  )}
                >
                  {/* Spoken as "Add Vada pav ₹20": the visible words stay in the name (voice control). */}
                  <span className="line-clamp-2 text-[13px] leading-tight font-bold">
                    <span className="sr-only">{t("Add")} </span>
                    {item.name}
                  </span>
                  <span className="text-xs text-muted">{formatRupees(item.price)}</span>
                </button>
                {quantity > 0 && (
                  <>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-ink shadow-lift"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => change(item.id, -1)}
                      aria-label={t("One less {item}", { item: item.name })}
                      className="absolute right-1.5 bottom-1.5 flex size-7 press items-center justify-center rounded-full bg-field text-ink shadow-sm"
                    >
                      <Minus size={14} aria-hidden />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Button
        variant="dashed"
        disabled={full}
        onClick={() => customSheet.current?.showModal()}
        className="min-h-11"
      >
        <Plus size={16} aria-hidden />
        {t("Custom item")}
      </Button>

      {lines.length > 0 && (
        <section
          aria-label={t("This bill")}
          className="flex flex-col rounded-card glass-soft px-3.5 py-1"
        >
          {lines.map((line) => (
            <div
              key={line.key}
              className="flex min-h-13 items-center gap-2 border-t border-line first:border-t-0"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{line.name}</span>
                <span className="text-xs text-muted">
                  {formatRupees(line.unitPrice)} × {line.quantity}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => change(line.key, -1)}
                  aria-label={t("One less {item}", { item: line.name })}
                  className="flex size-9 press items-center justify-center rounded-full bg-surface"
                >
                  <Minus size={15} aria-hidden />
                </button>
                <span className="w-6 text-center text-sm font-bold">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => change(line.key, 1)}
                  aria-label={t("One more {item}", { item: line.name })}
                  className="flex size-9 press items-center justify-center rounded-full bg-surface"
                >
                  <Plus size={15} aria-hidden />
                </button>
              </span>
              <span className="w-16 text-right font-display text-sm font-bold">
                {formatRupees(line.unitPrice * line.quantity)}
              </span>
            </div>
          ))}
        </section>
      )}

      <PaymentChoice value={payment} onChange={onPayment} />

      {lines.length > 0 && (
        <div className="flex flex-col gap-2 rounded-card glass-soft px-3.5 py-3">
          <TextField
            label={t("Customer's WhatsApp number (optional)")}
            name="customer"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            value={customer}
            // Digits only; "+91 98765 43210" keeps its last 10 digits.
            onChange={(e) => setCustomer(e.target.value.replace(/\D/g, "").slice(-10))}
            hint={t("Leave empty to pick the chat in WhatsApp.")}
          />
          <a
            href={whatsAppLink(message, customer)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (editor.busy) return e.preventDefault();
              // The link opens WhatsApp; the bill saves on the phone at the same moment.
              void editor.save(toSave());
            }}
            className="flex min-h-12 press items-center justify-center gap-2 rounded-cta bg-[#0e7a3e] px-4 text-[15px] font-bold text-white"
          >
            <MessageCircle size={18} aria-hidden />
            {existing ? t("Save and send bill on WhatsApp") : t("Save and send on WhatsApp")}
          </a>
        </div>
      )}

      <Footer
        editor={editor}
        canSave={lines.length > 0}
        label={t("Save bill")}
        onSave={() => editor.save(toSave())}
        editing={!!existing}
      />

      <CustomItemSheet ref={customSheet} onAdd={addCustom} />
    </>
  );
}

/** Bottom sheet for an item that is not in the list: name, price, how many. */
function CustomItemSheet({
  ref,
  onAdd,
}: {
  ref: React.Ref<HTMLDialogElement>;
  onAdd: (line: SaleLine) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [tried, setTried] = useState(false);

  const paise = parseRupeeInput(price);
  const qty = Number(quantity);
  const errors = {
    name: !name.trim()
      ? msg("Name the item.")
      : name.trim().length > 40
        ? msg("Keep it under 40 letters.")
        : undefined,
    price: !paise || paise > MAX_UNIT_PRICE ? msg("Enter a price like 30 or 12.50.") : undefined,
    quantity:
      !Number.isInteger(qty) || qty < 1 || qty > MAX_LINE_QUANTITY
        ? msg("Enter how many, from 1 to 999.")
        : undefined,
  };
  const valid = !errors.name && !errors.price && !errors.quantity;

  const close = (dialog: HTMLDialogElement | null) => {
    dialog?.close();
    setName("");
    setPrice("");
    setQuantity("1");
    setTried(false);
  };

  return (
    <dialog
      ref={ref}
      aria-label={t("Custom item")}
      className="sheet"
      onClick={(e) => e.target === e.currentTarget && close(e.currentTarget)}
    >
      <form
        className="m-2 mb-[max(8px,env(safe-area-inset-bottom))] flex flex-col gap-3 rounded-[28px] border border-glass-edge bg-glass-strong p-4 shadow-glass backdrop-blur-xl"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (!valid) return;
          onAdd({ itemId: null, name: name.trim(), unitPrice: paise!, quantity: qty });
          close(e.currentTarget.closest("dialog"));
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t("Custom item")}</h2>
          <button
            type="button"
            aria-label={t("Close")}
            onClick={(e) => close(e.currentTarget.closest("dialog"))}
            className="flex size-10 press items-center justify-center rounded-full bg-surface"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <TextField
          label={t("Item name")}
          name="customName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          error={tried ? errors.name : undefined}
        />
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <TextField
            label={t("Price for one (₹)")}
            name="customPrice"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={tried ? errors.price : undefined}
          />
          <TextField
            label={t("How many")}
            name="customQuantity"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
            error={tried ? errors.quantity : undefined}
          />
        </div>
        <Button type="submit" size="lg">
          {t("Add to bill")}
        </Button>
      </form>
    </dialog>
  );
}
