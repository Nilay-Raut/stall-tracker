"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { useT } from "@/i18n/client";
import { formatRupees } from "@/lib/money";
import { initialFormState } from "@/server/actions/formState";
import { saveTarget } from "@/server/actions/target";

type Props = {
  monthName: string;
  /** The current target, or null if none is set yet. */
  target: number | null;
  /** Last month's target, offered when none is set. */
  suggestion: number | null;
};

/** The target line with "Change", or the form to set one. */
export function TargetForm({ monthName, target, suggestion }: Props) {
  const t = useT();
  const [state, formAction, pending] = useActionState(saveTarget, initialFormState);
  const start = target ?? suggestion;
  const [value, setValue] = useState(start ? String(start / 100) : "");

  // The form is open from "Change" until the next successful save. Remembering which
  // save it was opened after lets this be worked out, without an effect.
  const lastSave = state.values?.saved ?? "none";
  const [openedAfter, setOpenedAfter] = useState<string | null>(null);
  const editing = target === null || openedAfter === lastSave;

  if (!editing && target !== null) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {t("Profit target {amount}", { amount: formatRupees(target) })}
        </span>
        <Button
          variant="outline"
          className="min-h-10 px-3 text-[13px]"
          onClick={() => setOpenedAfter(lastSave)}
        >
          {t("Change")}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2.5" noValidate>
      <MoneyInput
        label={t("Profit you want in {month}", { month: monthName })}
        name="target"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="80000"
        error={state.fieldErrors?.target}
        hint={t("After expenses and fixed costs like rent and salary.")}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? t("Saving…") : t("Save target")}
        </Button>
        {target !== null && (
          <Button variant="outline" onClick={() => setOpenedAfter(null)}>
            {t("Cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
