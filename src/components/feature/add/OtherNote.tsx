"use client";

import { TextField } from "@/components/ui/TextField";
import { MAX_NOTE_LENGTH } from "@/domain/entry";
import { type NoteHint, noteKey } from "@/domain/expenseNotes";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { formatRupees } from "@/lib/money";

/**
 * What an "Other" expense was for, with the notes used before as one-tap chips.
 * Tapping a chip fills the note, and the amount too when none is typed yet.
 */
export function OtherNote({
  value,
  onChange,
  hints,
  onPickAmount,
}: {
  value: string;
  onChange: (note: string) => void;
  hints: NoteHint[];
  onPickAmount: (amount: number) => void;
}) {
  const t = useT();
  const current = noteKey(value);

  return (
    <div className="-mt-1 flex flex-col gap-2">
      <TextField
        label={t("What was it for? (optional)")}
        name="note"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("e.g. Ice, Repairs, Water")}
        maxLength={MAX_NOTE_LENGTH}
        autoComplete="off"
      />
      {hints.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">{t("Used before")}</span>
          <div className="flex flex-wrap gap-2">
            {hints.map((hint) => {
              const picked = noteKey(hint.note) === current;
              return (
                <button
                  key={noteKey(hint.note)}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => {
                    onChange(hint.note);
                    onPickAmount(hint.lastAmount);
                  }}
                  className={cn(
                    "min-h-10 press rounded-full border px-3.5 text-[13px] font-semibold",
                    picked
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-accent/30 bg-accent-soft text-ink",
                  )}
                >
                  {hint.note}
                  <span className={cn("ml-1.5 font-normal", !picked && "text-muted")}>
                    {formatRupees(hint.lastAmount)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hints from the server, with notes saved on this phone but not yet in them
 * (just typed, or offline) put first, so a new note is offered straight away.
 */
export function mergeNoteHints(
  server: ReadonlyArray<NoteHint>,
  local: ReadonlyArray<{ note?: string | null; amount: number }>,
  limit = 8,
): NoteHint[] {
  const seen = new Set(server.map((h) => noteKey(h.note)));
  const fresh: NoteHint[] = [];
  for (const entry of local) {
    const key = entry.note ? noteKey(entry.note) : "";
    if (!key || seen.has(key)) continue;
    seen.add(key);
    fresh.push({ note: entry.note!.trim(), lastAmount: entry.amount });
  }
  return [...fresh, ...server].slice(0, limit);
}
