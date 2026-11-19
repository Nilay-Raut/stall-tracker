import "server-only";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { type NoteHint, rankNoteHints } from "@/domain/expenseNotes";
import { getDb } from "@/server/db/client";
import { entries } from "@/server/db/schema";

/** Notes typed on recent "Other" expenses, offered for quick add on the expense form. */
export async function getExpenseNoteHints(shopId: string): Promise<NoteHint[]> {
  const rows = await getDb()
    .select({ note: entries.note, amount: entries.amount })
    .from(entries)
    .where(
      and(
        eq(entries.shopId, shopId),
        eq(entries.type, "expense"),
        isNotNull(entries.note),
        isNull(entries.deletedAt),
      ),
    )
    .orderBy(desc(entries.occurredAt))
    .limit(300); // recent use is what matters
  return rankNoteHints(rows.map((row) => ({ note: row.note ?? "", amount: row.amount })));
}
