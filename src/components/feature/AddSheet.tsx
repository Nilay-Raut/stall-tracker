"use client";

import {
  ArrowUpRight,
  CalendarCheck,
  HandCoins,
  Landmark,
  type LucideIcon,
  ReceiptIndianRupee,
  X,
} from "lucide-react";
import type { Ref } from "react";
import { useShopSnapshot } from "@/client/localStore";
import { AppLink } from "@/components/ui/AppLink";
import { type EntryType, takesSaleEntries } from "@/domain/entry";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { ENTRY_PATHS } from "@/lib/labels";

const OPTIONS: ReadonlyArray<{
  type: EntryType;
  label: string;
  note: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    type: "sale",
    label: msg("Sale"),
    note: msg("Money coming in"),
    icon: ReceiptIndianRupee,
    tone: "bg-accent text-accent-ink",
  },
  {
    type: "expense",
    label: msg("Expense"),
    note: msg("Money spent for the shop"),
    icon: ArrowUpRight,
    tone: "bg-ink text-paper",
  },
  {
    type: "cash_out",
    label: msg("Cash out"),
    note: msg("Cash you take for yourself"),
    icon: HandCoins,
    tone: "bg-surface text-ink",
  },
  {
    type: "deposit",
    label: msg("Cash to bank"),
    note: msg("Drawer cash paid into the UPI account"),
    icon: Landmark,
    tone: "bg-surface text-ink",
  },
  {
    type: "fixed_paid",
    label: msg("Pay rent or salary"),
    note: msg("A monthly fixed cost paid today"),
    icon: CalendarCheck,
    tone: "bg-surface text-ink",
  },
];

/**
 * Bottom sheet opened by the + in the tab bar. A native <dialog>, so the
 * browser handles focus, the Back gesture and Esc. Tapping outside closes it.
 */
export function AddSheet({ ref }: { ref: Ref<HTMLDialogElement> }) {
  const t = useT();
  const snapshot = useShopSnapshot();
  // "Totals only" shops enter sales at closing, not one by one (rule 13).
  const options = OPTIONS.filter(
    (o) => o.type !== "sale" || !snapshot || takesSaleEntries(snapshot.salesMode),
  );

  const close = (dialog: HTMLDialogElement | null) => dialog?.close();

  return (
    <dialog
      ref={ref}
      aria-label={t("Add an entry")}
      className="sheet"
      onClick={(e) => e.target === e.currentTarget && close(e.currentTarget)}
    >
      <div className="m-2 mb-[max(8px,env(safe-area-inset-bottom))] flex flex-col gap-2 rounded-[28px] border border-glass-edge bg-glass-strong p-3 shadow-glass backdrop-blur-xl">
        <div className="flex items-center justify-between px-1.5 pt-1">
          <h2 className="font-display text-lg font-bold">{t("Add an entry")}</h2>
          <button
            type="button"
            aria-label={t("Close")}
            onClick={(e) => close(e.currentTarget.closest("dialog"))}
            className="flex size-10 press items-center justify-center rounded-full bg-surface"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <AppLink
              key={option.type}
              href={ENTRY_PATHS[option.type]}
              onClick={(e) => close(e.currentTarget.closest("dialog"))}
              className="flex min-h-16 press items-center gap-3.5 rounded-[20px] bg-field px-3 py-2.5"
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                  option.tone,
                )}
              >
                <Icon size={22} aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="text-base font-bold">{t(option.label)}</span>
                <span className="text-xs text-muted">{t(option.note)}</span>
              </span>
            </AppLink>
          );
        })}
      </div>
    </dialog>
  );
}
