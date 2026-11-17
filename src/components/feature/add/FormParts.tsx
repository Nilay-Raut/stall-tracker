"use client";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import type { PaymentMode } from "@/domain/entry";
import { useT } from "@/i18n/client";
import type { useEntryEditor } from "./useEntryEditor";

// Pieces shared by the add / edit forms (EntryForms.tsx, BillPanel.tsx).

/** Cash / UPI, shared by the quick amount and the bill. */
export function PaymentChoice({
  value,
  onChange,
}: {
  value: PaymentMode;
  onChange: (mode: PaymentMode) => void;
}) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={t("Paid by")}>
      {(["cash", "upi"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          className={
            value === m
              ? "h-14 press rounded-card border border-accent bg-accent text-[17px] font-bold text-accent-ink shadow-lift"
              : "h-14 press rounded-card glass-soft text-[17px] font-bold"
          }
        >
          {m === "cash" ? t("Cash") : "UPI"}
        </button>
      ))}
    </div>
  );
}

/** Save (and Delete when editing) at the bottom of every add / edit form. */
export function Footer({
  editor,
  canSave,
  label,
  onSave,
  editing,
}: {
  editor: ReturnType<typeof useEntryEditor>;
  canSave: boolean;
  label: string;
  onSave: () => void;
  editing: boolean;
}) {
  const t = useT();
  return (
    <div className="mt-auto flex flex-col gap-1.5 pt-2">
      <FormError message={editor.error ?? undefined} />
      <Button size="lg" disabled={!canSave || editor.busy} onClick={onSave}>
        {label}
      </Button>
      {editing && (
        <Button variant="ghost" disabled={editor.busy} onClick={() => void editor.remove()}>
          {t("Delete entry")}
        </Button>
      )}
    </div>
  );
}
