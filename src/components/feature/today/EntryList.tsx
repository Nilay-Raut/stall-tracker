"use client";

import { AppLink } from "@/components/ui/AppLink";
import { discardRefusedChange } from "@/client/entries";
import type { OutboxRow } from "@/client/localDb";
import { describeLines } from "@/domain/bill";
import type { Entry, EntryType } from "@/domain/entry";
import { useLang, useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/dates";
import { ENTRY_PATHS, describeEntry } from "@/lib/labels";
import { formatSignedRupees } from "@/lib/money";
import { ENTRY_ICON_MASKS } from "./entryIcons";

const REFUSAL_TEXT: Record<string, string> = {
  invalid: msg("Something in it is not valid."),
  "date-out-of-range": msg("The date is too far back or ahead."),
  conflict: msg("It clashes with another entry."),
};

const TONES: Record<EntryType, string> = {
  sale: "bg-accent-soft text-accent-fg",
  expense: "bg-surface text-ink",
  cash_out: "bg-warn-bg text-warn-ink",
};

type Props = { title: string; entries: Entry[]; pending: Map<string, OutboxRow> };

/** A day's entries, newest first. Tap a row to edit it. */
export function EntryList({ title, entries, pending }: Props) {
  const t = useT();
  const lang = useLang();
  return (
    <section className="flex flex-col rounded-card glass-soft px-4 pt-3 pb-1">
      <div className="flex items-baseline justify-between pb-2">
        <h2 className="text-sm font-bold">
          {title} ({entries.length})
        </h2>
        {entries.length > 0 && <span className="text-xs text-muted">{t("Tap a row to edit")}</span>}
      </div>

      {entries.length === 0 && (
        <p className="border-t border-line py-5 text-center text-sm text-muted">
          {t("No entries yet. Add a sale or an expense above.")}
        </p>
      )}

      {entries.map((entry) => {
        const { title: label, note } = describeEntry(entry, t);
        const signed = entry.type === "sale" ? entry.amount : -entry.amount;
        const change = pending.get(entry.id);
        const mask = `${ENTRY_ICON_MASKS[entry.type]} center / contain no-repeat`;
        return (
          <div key={entry.id} className="border-t border-line">
            <AppLink
              href={`${ENTRY_PATHS[entry.type]}?id=${entry.id}`}
              className="grid min-h-16 press grid-cols-[2.5rem_1fr_auto] items-center gap-3"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  TONES[entry.type],
                )}
              >
                {/* The icon is painted in the text colour through a mask: no SVG nodes per row. */}
                <span className="size-[18px] bg-current" style={{ mask, WebkitMask: mask }} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-semibold">{label}</span>
                {entry.lines && (
                  <span className="truncate text-xs font-medium text-ink">
                    {describeLines(entry.lines)}
                  </span>
                )}
                <span className="text-xs text-muted">
                  {formatTime(entry.occurredAt, lang)} · {note}
                  {change && !change.error && ` · ${t("not sent yet")}`}
                </span>
              </span>
              <span
                className={cn(
                  "font-display text-base font-bold",
                  entry.type === "sale" && "text-accent-fg",
                )}
              >
                {formatSignedRupees(signed)}
              </span>
            </AppLink>
            {change?.error && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-control bg-warn-bg px-2.5 py-1.5 text-xs text-warn-ink">
                <span>
                  {t("Not saved: {reason}", {
                    reason: t(REFUSAL_TEXT[change.error] ?? msg("the server refused it.")),
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => void discardRefusedChange(entry.id)}
                  className="min-h-9 font-bold underline"
                >
                  {t("Discard")}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
