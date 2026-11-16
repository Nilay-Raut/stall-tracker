"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { FormError } from "@/components/ui/FormError";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { type MarginBasis, workOutMargin } from "@/domain/itemMargin";
import { useT } from "@/i18n/client";
import { msg } from "@/i18n/translate";
import { formatRupees, parseRupeeInput } from "@/lib/money";
import { initialFormState } from "@/server/actions/formState";
import { deleteItem, saveItem } from "@/server/actions/items";

const BASES = [
  { value: "cost", label: msg("My cost") },
  { value: "margin", label: msg("Margin in ₹") },
  { value: "percent", label: msg("Margin in %") },
] as const;

const VALUE_LABELS: Record<MarginBasis, string> = {
  cost: msg("Cost to make one plate (₹)"),
  margin: msg("Margin you keep on one plate (₹)"),
  percent: msg("Margin as % of selling price"),
};

type Props = {
  item: { id: string; name: string; price: number; cost: number } | null;
  /** Average plates sold per day lately, if this item has been counted. */
  averagePlates: number | null;
};

const rupees = (paise: number) => String(Math.round(paise) / 100);

/** Add or edit an item (wireframe screen 12). The app works out cost, margin and %. */
export function ItemForm({ item, averagePlates }: Props) {
  const t = useT();
  const [state, formAction, pending] = useActionState(saveItem, initialFormState);
  const errors = state.fieldErrors ?? {};

  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? rupees(item.price) : "");
  const [basis, setBasis] = useState<MarginBasis>("cost");
  const [value, setValue] = useState(item ? rupees(item.cost) : "");

  const pricePaise = parseRupeeInput(price) ?? 0;
  const amount = basis === "percent" ? Number(value || NaN) : parseRupeeInput(value);
  const result =
    pricePaise > 0 && amount !== null && Number.isFinite(amount)
      ? workOutMargin(pricePaise, basis, amount)
      : null;

  /** Switching what you know keeps the numbers: the box shows the same item in the new terms. */
  const switchBasis = (next: MarginBasis) => {
    if (result) {
      setValue(
        next === "cost"
          ? rupees(result.cost)
          : next === "margin"
            ? rupees(result.margin)
            : String(Math.round(result.percent)),
      );
    }
    setBasis(next);
  };

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-3" noValidate>
      <input type="hidden" name="id" value={item?.id ?? "new"} />
      <input type="hidden" name="basis" value={basis} />
      <FormError message={state.error} />

      <TextField
        label={t("Item name")}
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("Veg steam momos")}
        maxLength={40}
        error={errors.name}
        required
      />
      <MoneyInput
        label={t("Selling price for one plate (₹)")}
        name="price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="0"
        error={errors.price}
      />
      <ChoiceGroup
        label={t("What do you know?")}
        choices={BASES.map((b) => ({ value: b.value, label: t(b.label) }))}
        value={basis}
        onChange={switchBasis}
      />
      {basis === "percent" ? (
        <TextField
          label={t(VALUE_LABELS.percent)}
          name="value"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          error={errors.value}
        />
      ) : (
        <MoneyInput
          label={t(VALUE_LABELS[basis])}
          name="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          error={errors.value}
        />
      )}

      <section
        aria-live="polite"
        className="flex flex-col gap-2.5 rounded-cta bg-surface px-4 py-3.5"
      >
        <span className="text-[13px] font-semibold text-muted">
          {t("The app works out the rest")}
        </span>
        <div className="grid grid-cols-3 gap-2">
          <Figure label={t("Cost")} value={result ? formatRupees(Math.round(result.cost)) : "—"} />
          <Figure
            label={t("Margin")}
            value={result ? formatRupees(Math.round(result.margin)) : "—"}
          />
          <Figure label={t("Margin %")} value={result ? `${Math.round(result.percent)}%` : "—"} />
        </div>
        {result && averagePlates !== null && (
          <span className="text-[13px] text-muted">
            {t("At {plates} plates a day this item earns {amount} a day.", {
              plates: averagePlates,
              amount: formatRupees(Math.round(result.margin * averagePlates)),
            })}
          </span>
        )}
      </section>

      {result && result.margin < 0 && (
        <Notice title={t("Cost is higher than price. You lose money on each plate.")} />
      )}

      <div className="mt-auto flex flex-col gap-1.5 pt-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("Saving…") : t("Save item")}
        </Button>
        {item && (
          <Button
            type="submit"
            variant="ghost"
            disabled={pending}
            formAction={deleteItem.bind(null, item.id)}
            formNoValidate
            onClick={(e) => {
              if (
                !window.confirm(
                  t("Remove {name}? Past plate counts are kept.", { name: item.name }),
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {t("Remove item")}
          </Button>
        )}
      </div>
    </form>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-display text-2xl font-bold">{value}</span>
    </div>
  );
}
