import type { Paise } from "@/lib/money";

/** A past "Other" expense note offered for quick add: "Ice · ₹50". */
export type NoteHint = { note: string; lastAmount: Paise };

export const MAX_NOTE_HINTS = 8;

/** Same note whatever the case or spacing: "Ice", "ice " and "ICE" are one. */
export const noteKey = (note: string) => note.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The notes to offer next time, most used first (ties: most recent first).
 * `uses` must be newest first; each note keeps its newest spelling and amount.
 */
export function rankNoteHints(
  uses: ReadonlyArray<{ note: string; amount: Paise }>,
  limit = MAX_NOTE_HINTS,
): NoteHint[] {
  const byKey = new Map<string, NoteHint & { count: number; order: number }>();
  uses.forEach((use, order) => {
    const key = noteKey(use.note);
    if (!key) return;
    const seen = byKey.get(key);
    if (seen) seen.count += 1;
    else byKey.set(key, { note: use.note.trim(), lastAmount: use.amount, count: 1, order });
  });
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, limit)
    .map(({ note, lastAmount }) => ({ note, lastAmount }));
}
