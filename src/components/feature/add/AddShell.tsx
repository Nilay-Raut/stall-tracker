"use client";

import { AppLink } from "@/components/ui/AppLink";
import type { ReactNode } from "react";
import type { EntryType } from "@/domain/entry";
import { useLang, useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { type BusinessDate, formatDayLabel } from "@/lib/dates";
import { ENTRY_PATHS } from "@/lib/labels";

const TABS: ReadonlyArray<{ type: EntryType; label: string; editTitle: string }> = [
  { type: "sale", label: msg("Sale"), editTitle: msg("Edit sale") },
  { type: "expense", label: msg("Expense"), editTitle: msg("Edit expense") },
  { type: "cash_out", label: msg("Cash out"), editTitle: msg("Edit cash out") },
  { type: "deposit", label: msg("To bank"), editTitle: msg("Edit cash to bank") },
];

type Props = {
  type: EntryType;
  date: BusinessDate;
  today: BusinessDate;
  onDateChange: (date: BusinessDate) => void;
  /** Editing an existing entry: its type cannot change. */
  editing: boolean;
  children: ReactNode;
};

/** Frame shared by the add/edit screens: back link, date picker, type tabs. */
export function AddShell({ type, date, today, onDateChange, editing, children }: Props) {
  const t = useT();
  const lang = useLang();
  return (
    <div className="flex flex-1 flex-col gap-3 px-5 pt-3.5 pb-5">
      <header className="flex min-h-12 items-center justify-between">
        <AppLink
          href={date === today ? "/" : `/day/${date}`}
          className="flex min-h-11 items-center text-[15px] font-semibold"
        >
          ‹ {date === today ? t("Today") : t("Back")}
        </AppLink>
        <DatePicker date={date} today={today} onChange={onDateChange} />
      </header>

      {editing || !TABS.some((tab) => tab.type === type) ? (
        <h1 className="font-display text-xl font-bold">
          {type === "fixed_paid"
            ? editing
              ? t("Edit fixed cost paid")
              : t("Pay a fixed cost")
            : t(TABS.find((tab) => tab.type === type)?.editTitle ?? "")}
        </h1>
      ) : (
        <nav
          aria-label={t("Entry type")}
          className="grid h-12 grid-cols-4 gap-1 rounded-full glass-soft p-1"
        >
          {TABS.map((tab) => {
            const active = tab.type === type;
            return (
              <AppLink
                key={tab.type}
                href={
                  date === today ? ENTRY_PATHS[tab.type] : `${ENTRY_PATHS[tab.type]}?date=${date}`
                }
                replace
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex press items-center justify-center rounded-full text-[13px] leading-tight",
                  active ? "bg-ink font-bold text-paper" : "font-semibold text-muted",
                )}
              >
                {t(tab.label)}
              </AppLink>
            );
          })}
        </nav>
      )}

      {date !== today && (
        <p className="rounded-control bg-warn-bg px-3 py-2 text-xs font-semibold text-warn-ink">
          {t("This entry goes on {day}, not today.", { day: formatDayLabel(date, lang) })}
        </p>
      )}

      {children}
    </div>
  );
}

/** Looks like a button; tapping it opens the phone's own date picker. */
function DatePicker({
  date,
  today,
  onChange,
}: {
  date: BusinessDate;
  today: BusinessDate;
  onChange: (date: BusinessDate) => void;
}) {
  const t = useT();
  const lang = useLang();
  return (
    <label className="relative flex h-10 press items-center rounded-full glass-soft px-3.5 text-[13px] font-semibold">
      {formatDayLabel(date, lang)} ▾
      <input
        type="date"
        aria-label={t("Date of this entry")}
        value={date}
        max={today}
        onChange={(e) => e.target.value && e.target.value <= today && onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}
