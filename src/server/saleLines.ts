import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { lineNameKey } from "@/domain/bill";
import type { SaleLine } from "@/domain/entry";
import { type Tx, getDb } from "@/server/db/client";
import { items, saleLines } from "@/server/db/schema";

/**
 * Replaces the bill lines of a sale. The cost of each saved item is looked up
 * here (never taken from the phone), and an item id that is not this shop's
 * own is kept as a custom line, so no other shop's item can be referenced.
 */
export async function saveLines(
  tx: Tx,
  shopId: string,
  entryId: string,
  lines: ReadonlyArray<SaleLine>,
): Promise<void> {
  await deleteLines(tx, entryId);
  const ids = [...new Set(lines.map((l) => l.itemId).filter((id): id is string => !!id))];
  const known = ids.length
    ? await tx
        .select({ id: items.id, cost: items.cost })
        .from(items)
        .where(and(eq(items.shopId, shopId), inArray(items.id, ids)))
    : [];
  const costs = new Map(known.map((item) => [item.id, item.cost]));

  await tx.insert(saleLines).values(
    lines.map((line, i) => {
      const own = line.itemId !== null && costs.has(line.itemId);
      return {
        entryId,
        lineNo: i,
        shopId,
        itemId: own ? line.itemId : null,
        name: line.name.trim(),
        nameKey: lineNameKey(line.name),
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        costAtTime: own ? costs.get(line.itemId!)! : null,
      };
    }),
  );
}

export async function deleteLines(tx: Tx, entryId: string): Promise<void> {
  await tx.delete(saleLines).where(eq(saleLines.entryId, entryId));
}

/** Bill lines of the given sales, by entry id (sales without a bill are left out). */
export async function linesFor(entryIds: string[]): Promise<Map<string, SaleLine[]>> {
  const out = new Map<string, SaleLine[]>();
  if (entryIds.length === 0) return out;
  const rows = await getDb()
    .select()
    .from(saleLines)
    .where(inArray(saleLines.entryId, entryIds))
    .orderBy(asc(saleLines.entryId), asc(saleLines.lineNo));
  for (const row of rows) {
    const list = out.get(row.entryId) ?? [];
    list.push({
      itemId: row.itemId,
      name: row.name,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
    });
    out.set(row.entryId, list);
  }
  return out;
}
