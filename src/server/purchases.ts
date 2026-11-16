import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Purchase } from "@/domain/entry";
import { type MaterialHint, fromMilli, purchaseRate, toMilli } from "@/domain/materials";
import type { Paise } from "@/lib/money";
import { type Tx, getDb } from "@/server/db/client";
import { entries, materials, purchases, suppliers } from "@/server/db/schema";

const keyOf = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/** Finds a material by name (ignoring case), creating it if new. */
async function materialId(tx: Tx, shopId: string, name: string, unit: string): Promise<string> {
  const nameKey = keyOf(name);
  await tx
    .insert(materials)
    .values({ shopId, name: name.trim(), nameKey, unit })
    .onConflictDoNothing();
  const [row] = await tx
    .select({ id: materials.id })
    .from(materials)
    .where(and(eq(materials.shopId, shopId), eq(materials.nameKey, nameKey)));
  return row.id;
}

/** Finds a supplier by name (ignoring case), creating it if new. */
async function supplierId(tx: Tx, shopId: string, name: string): Promise<string> {
  const nameKey = keyOf(name);
  await tx.insert(suppliers).values({ shopId, name: name.trim(), nameKey }).onConflictDoNothing();
  const [row] = await tx
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.shopId, shopId), eq(suppliers.nameKey, nameKey)));
  return row.id;
}

/** Saves (or replaces) the material details of an expense entry. */
export async function savePurchase(
  tx: Tx,
  shopId: string,
  entryId: string,
  purchase: Purchase,
  amount: Paise,
): Promise<void> {
  const unit = purchase.unit.trim().toLowerCase();
  const values = {
    shopId,
    materialId: await materialId(tx, shopId, purchase.material, unit),
    supplierId: purchase.supplier?.trim() ? await supplierId(tx, shopId, purchase.supplier) : null,
    quantityMilli: toMilli(purchase.quantity),
    unit,
    rate: purchaseRate(amount, purchase.quantity),
  };
  await tx
    .insert(purchases)
    .values({ entryId, ...values })
    .onConflictDoUpdate({ target: purchases.entryId, set: values });
}

export async function deletePurchase(tx: Tx, entryId: string): Promise<void> {
  await tx.delete(purchases).where(eq(purchases.entryId, entryId));
}

/** Material details of the given entries, by entry id. */
export async function purchasesFor(entryIds: string[]): Promise<Map<string, Purchase>> {
  if (entryIds.length === 0) return new Map();
  const rows = await getDb()
    .select({
      entryId: purchases.entryId,
      material: materials.name,
      supplier: suppliers.name,
      quantityMilli: purchases.quantityMilli,
      unit: purchases.unit,
    })
    .from(purchases)
    .innerJoin(materials, eq(materials.id, purchases.materialId))
    .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
    .where(inArray(purchases.entryId, entryIds));
  return new Map(
    rows.map((r) => [
      r.entryId,
      {
        material: r.material,
        supplier: r.supplier,
        quantity: fromMilli(r.quantityMilli),
        unit: r.unit,
      },
    ]),
  );
}

/**
 * What the phone needs to help with the next purchase: each material's last
 * rate and supplier (for "₹6 more than your last purchase"), and supplier names.
 */
export async function getPurchaseHints(
  shopId: string,
): Promise<{ materials: MaterialHint[]; suppliers: string[] }> {
  const db = getDb();
  const [rows, supplierRows] = await Promise.all([
    db
      .select({
        name: materials.name,
        unit: purchases.unit,
        rate: purchases.rate,
        supplier: suppliers.name,
        date: entries.businessDate,
        occurredAt: entries.occurredAt,
      })
      .from(purchases)
      .innerJoin(entries, eq(entries.id, purchases.entryId))
      .innerJoin(materials, eq(materials.id, purchases.materialId))
      .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
      .where(and(eq(purchases.shopId, shopId), isNull(entries.deletedAt)))
      .orderBy(desc(entries.businessDate), desc(entries.occurredAt))
      .limit(500), // recent purchases are enough to know each material's last rate
    db.select({ name: suppliers.name }).from(suppliers).where(eq(suppliers.shopId, shopId)),
  ]);

  const latest = new Map<string, MaterialHint>();
  for (const row of rows) {
    if (latest.has(row.name)) continue; // rows are newest first
    latest.set(row.name, {
      name: row.name,
      unit: row.unit,
      lastRate: row.rate,
      lastSupplier: row.supplier,
      lastDate: row.date,
    });
  }
  return { materials: [...latest.values()], suppliers: supplierRows.map((s) => s.name) };
}
