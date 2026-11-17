"use client";

import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import type { Purchase } from "@/domain/entry";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import {
  COMMON_UNITS,
  type MaterialHint,
  findMaterial,
  purchaseRate,
  rateNote,
} from "@/domain/materials";
import { type Paise, formatRupees } from "@/lib/money";

export type MaterialDraft = { material: string; supplier: string; quantity: string; unit: string };

export const emptyDraft = (purchase: Purchase | null = null): MaterialDraft => ({
  material: purchase?.material ?? "",
  supplier: purchase?.supplier ?? "",
  quantity: purchase ? String(purchase.quantity) : "",
  unit: purchase?.unit ?? "",
});

/**
 * Turns the typed details into a purchase. All empty = no purchase (it is optional).
 * Returns an error message (English, shown through t()) when something is half filled in.
 */
export function draftToPurchase(draft: MaterialDraft): {
  purchase: Purchase | null;
  error?: string;
} {
  const material = draft.material.trim();
  if (!material && !draft.supplier.trim() && !draft.quantity.trim()) return { purchase: null };
  if (!material)
    return { purchase: null, error: msg("Name the material, or clear these details.") };

  const quantity = Number(draft.quantity.replace(",", "."));
  if (!draft.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100_000) {
    return { purchase: null, error: msg("Enter how much you bought, like 5 or 2.5.") };
  }
  if (Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 1e-6) {
    return { purchase: null, error: msg("Use at most 3 decimals.") };
  }
  const unit = draft.unit.trim().toLowerCase();
  if (!unit) return { purchase: null, error: msg("Enter the unit, like kg or litre.") };

  return { purchase: { material, supplier: draft.supplier.trim() || null, quantity, unit } };
}

type Props = {
  draft: MaterialDraft;
  onChange: (draft: MaterialDraft) => void;
  amount: Paise | null;
  hints: MaterialHint[];
  suppliers: string[];
  error?: string;
};

/** "Material details, optional, for price tracking" on Add expense (wireframe screen 4). */
export function MaterialDetails({ draft, onChange, amount, hints, suppliers, error }: Props) {
  const t = useT();
  const set = (patch: Partial<MaterialDraft>) => onChange({ ...draft, ...patch });
  const known = findMaterial(hints, draft.material);
  const quantity = Number(draft.quantity.replace(",", "."));
  const unit = draft.unit.trim().toLowerCase();
  const note =
    amount && quantity > 0 && unit
      ? rateNote(purchaseRate(amount, quantity), unit, known, formatRupees, t)
      : null;

  return (
    <section className="flex flex-col gap-2.5 rounded-card border border-dashed border-edge p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t("Material details")}</h2>
        <span className="text-xs text-muted">{t("Optional, for price tracking")}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label={t("Material")}
          name="material"
          value={draft.material}
          list="material-names"
          maxLength={40}
          placeholder={t("Oil")}
          className="h-11"
          onChange={(e) => {
            const hint = findMaterial(hints, e.target.value);
            // A known material brings its usual unit, unless one is already typed.
            set({ material: e.target.value, unit: draft.unit || hint?.unit || "" });
          }}
        />
        <TextField
          label={t("Supplier")}
          name="supplier"
          value={draft.supplier}
          list="supplier-names"
          maxLength={40}
          placeholder={known?.lastSupplier ?? t("Optional")}
          className="h-11"
          onChange={(e) => set({ supplier: e.target.value })}
        />
        <TextField
          label={t("Quantity")}
          name="quantity"
          inputMode="decimal"
          value={draft.quantity}
          placeholder="5"
          className="h-11"
          onChange={(e) => set({ quantity: e.target.value })}
        />
        <TextField
          label={t("Unit")}
          name="unit"
          value={draft.unit}
          list="unit-names"
          maxLength={12}
          placeholder="litre"
          className="h-11"
          onChange={(e) => set({ unit: e.target.value })}
        />
      </div>
      <datalist id="material-names">
        {hints.map((h) => (
          <option key={h.name} value={h.name} />
        ))}
      </datalist>
      <datalist id="supplier-names">
        {suppliers.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="unit-names">
        {COMMON_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      {error && <p className="text-xs text-danger">{t(error)}</p>}
      {note && <Notice title={note.title}>{note.detail}</Notice>}
    </section>
  );
}
