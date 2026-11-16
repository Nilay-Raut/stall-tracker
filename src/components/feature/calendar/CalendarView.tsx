"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLang, useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { type Month, formatMonth, monthGrid, shiftMonth } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { type BusinessDate, formatDayLabel } from "@/lib/dates";
import { formatRupees } from "@/lib/money";
import { markShopClosed } from "@/server/actions/days";
import type { CalendarDay } from "@/server/days";

const WEEKDAYS = [
  msg("Sun"),
  msg("Mon"),
  msg("Tue"),
  msg("Wed"),
  msg("Thu"),
  msg("Fri"),
  msg("Sat"),
];

type Props = { month: Month; today: BusinessDate; days: CalendarDay[] };

/** Calendar tab (wireframe screen 7): a month of days and the picked day's numbers. */
export function CalendarView({ month, today, days }: Props) {
  const t = useT();
  const lang = useLang();
  const byDate = new Map(days.map((day) => [day.date, day]));
  const isCurrentMonth = month === today.slice(0, 7);
  const [selected, setSelected] = useState<BusinessDate>(isCurrentMonth ? today : `${month}-01`);

  return (
    <>
      <header className="flex min-h-12 items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{formatMonth(month, lang)}</h1>
        <div className="flex gap-2">
          <MonthLink month={shiftMonth(month, -1)} label={t("Previous month")} text="‹" />
          <MonthLink
            month={shiftMonth(month, 1)}
            label={t("Next month")}
            text="›"
            disabled={isCurrentMonth}
          />
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted">
        {WEEKDAYS.map((d) => (
          <span key={d}>{t(d)}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {monthGrid(month).map((date, i) =>
          date ? (
            <DayCell
              key={date}
              date={date}
              day={byDate.get(date)}
              today={today}
              selected={date === selected}
              onPick={() => setSelected(date)}
            />
          ) : (
            <span key={`blank-${i}`} aria-hidden />
          ),
        )}
      </div>
      <p className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted">
        <span>● {t("Entered")}</span>
        <span>
          {t("Off")} = {t("Shop closed")}
        </span>
        <span>{t("Blank = No entry")}</span>
      </p>

      <DayPanel date={selected} day={byDate.get(selected)} today={today} />
    </>
  );
}

function MonthLink({
  month,
  label,
  text,
  disabled,
}: {
  month: Month;
  label: string;
  text: string;
  disabled?: boolean;
}) {
  const style =
    "flex size-11 items-center justify-center rounded-control border-[1.5px] border-ink text-lg font-semibold";
  if (disabled) {
    return (
      <span aria-disabled className={cn(style, "opacity-30")} aria-label={label}>
        {text}
      </span>
    );
  }
  return (
    <Link href={`/calendar?month=${month}`} aria-label={label} className={style}>
      {text}
    </Link>
  );
}

function DayCell({
  date,
  day,
  today,
  selected,
  onPick,
}: {
  date: BusinessDate;
  day: CalendarDay | undefined;
  today: BusinessDate;
  selected: boolean;
  onPick: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const future = date > today;
  const off = day?.status === "off";
  const entered = !!day && (day.entryCount > 0 || day.status === "closed");
  const mark = off ? t("Off") : entered ? "●" : "";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={future}
      aria-pressed={selected}
      aria-label={
        off
          ? t("{day}, shop closed", { day: formatDayLabel(date, lang) })
          : entered
            ? t("{day}, has entries", { day: formatDayLabel(date, lang) })
            : formatDayLabel(date, lang)
      }
      className={cn(
        "flex h-[50px] flex-col items-center justify-center gap-px rounded-control border-[1.5px]",
        selected
          ? "border-accent bg-accent text-accent-ink"
          : date === today
            ? "border-ink"
            : "border-line",
        future && "text-muted",
      )}
    >
      <span className="text-[15px] font-semibold">{Number(date.slice(8))}</span>
      <span
        className={cn(
          "min-h-3 text-[11px] leading-none font-bold",
          !selected && (off ? "text-muted" : "text-accent"),
        )}
      >
        {mark}
      </span>
    </button>
  );
}

function DayPanel({
  date,
  day,
  today,
}: {
  date: BusinessDate;
  day: CalendarDay | undefined;
  today: BusinessDate;
}) {
  const t = useT();
  const lang = useLang();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const off = day?.status === "off";
  const hasData = !!day && (day.entryCount > 0 || day.status === "closed");
  const isToday = date === today;

  const toggleOff = (makeOff: boolean) =>
    startTransition(async () => {
      setMessage(null);
      const result = await markShopClosed(date, makeOff);
      if (result === "has-entries") setMessage(t("This day has entries, so the shop was open."));
      if (result === "already-closed") setMessage(t("This day was already closed with a count."));
      if (result === "bad-date") setMessage(t("This day cannot be changed."));
    });

  return (
    <Card className="gap-2">
      <h2 className="text-base font-bold">
        {formatDayLabel(date, lang)}
        {isToday && ` ${t("(today)")}`}
        {day?.status === "closed" && (
          <span className="ml-2 text-xs font-semibold text-accent">{t("Day closed")}</span>
        )}
      </h2>

      {hasData && day && (
        <div className="grid grid-cols-3 gap-2">
          <Figure label={t("Sales")} value={formatRupees(day.sales)} />
          <Figure label={t("Expenses")} value={formatRupees(day.expenses)} />
          <Figure label={t("Profit")} value={formatRupees(day.profit)} />
        </div>
      )}
      {off && (
        <p className="text-sm text-muted">{t("Shop closed. This day is left out of averages.")}</p>
      )}
      {!hasData && !off && (
        <p className="text-sm text-muted">{t("No entries for this day yet.")}</p>
      )}
      {message && (
        <p role="status" className="text-sm font-semibold text-danger">
          {message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <ButtonLink href={isToday ? "/" : `/day/${date}`} className="text-sm font-bold">
          {t("Add or edit entries")}
        </ButtonLink>
        {off ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => toggleOff(false)}
            className="min-h-12 rounded-card border-[1.5px] border-dashed border-ink text-sm font-semibold disabled:opacity-40"
          >
            {t("Shop was open")}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || hasData}
            onClick={() => toggleOff(true)}
            className="min-h-12 rounded-card border-[1.5px] border-dashed border-ink text-sm font-semibold disabled:opacity-40"
          >
            {t("Mark shop closed")}
          </button>
        )}
      </div>
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-[17px] font-bold">{value}</span>
    </div>
  );
}
