"use client";

import { AppLink } from "@/components/ui/AppLink";
import { discardRefusedChange } from "@/client/entries";
import type { OutboxRow } from "@/client/localDb";
import type { Entry } from "@/domain/entry";
import { useLang, useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { formatTime } from "@/lib/dates";
import { ENTRY_PATHS, describeEntry } from "@/lib/labels";
import { formatSignedRupees } from "@/lib/money";

const REFUSAL_TEXT: Record<string, string> = {
  invalid: msg("Something in it is not valid."),
  "date-out-of-range": msg("The date is too far back or ahead."),
  conflict: msg("It clashes with another entry."),
};

type Props = { title: string; entries: Entry[]; pending: Map<string, OutboxRow> };

/** A day's entries, newest first. Tap a row to edit it. */
export function EntryList({ title, entries, pending }: Props) {
  const t = useT();
  const lang = useLang();
  return (
    <section className="flex flex-col">
      <div className="flex items-baseline justify-between pb-1">
        <h2 className="text-sm font-bold">
          {title} ({entries.length})
        </h2>
        {entries.length > 0 && <span className="text-xs text-muted">{t("Tap a row to edit")}</span>}
      </div>

      {entries.length === 0 && (
        <p className="border-t border-line py-4 text-sm text-muted">
          {t("No entries yet. Add a sale or an expense above.")}
        </p>
      )}

      {entries.map((entry) => {
        const { title: label, note } = describeEntry(entry, t);
        const signed = entry.type === "sale" ? entry.amount : -entry.amount;
        const change = pending.get(entry.id);
        return (
          <div key={entry.id} className="border-t border-line">
            <AppLink
              href={`${ENTRY_PATHS[entry.type]}?id=${entry.id}`}
              className="grid min-h-14 grid-cols-[4.5rem_1fr_auto] items-center gap-2"
            >
              <span className="text-xs text-muted">{formatTime(entry.occurredAt, lang)}</span>
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold">{label}</span>
                <span className="text-xs text-muted">
                  {note}
                  {change && !change.error && ` · ${t("not sent yet")}`}
                </span>
              </span>
              <span className="text-[15px] font-bold">{formatSignedRupees(signed)}</span>
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
