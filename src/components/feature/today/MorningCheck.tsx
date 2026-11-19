"use client";

import { Sunrise } from "lucide-react";
import { useState, useTransition } from "react";
import { useDailyFlag } from "@/client/dailyFlag";
import { patchSnapshot } from "@/client/entries";
import { useIsOffline } from "@/client/online";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useT } from "@/i18n/client";
import type { BusinessDate } from "@/lib/dates";
import { type Paise, formatRupees, parseRupeeInput } from "@/lib/money";
import { setTodayOpeningCash } from "@/server/actions/days";

/**
 * Start of the day: "Is ₹1,140 in the drawer?" Confirming (or fixing) the opening
 * cash makes the drawer figure on Today, and the check at closing, right.
 * Asked once a day on this phone, before the first entry.
 */
export function MorningCheck({ today, openingCash }: { today: BusinessDate; openingCash: Paise }) {
  const t = useT();
  const offline = useIsOffline();
  const [checked, markChecked] = useDailyFlag("stall:drawer-checked", today);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (checked !== false) return null;

  const save = () =>
    startTransition(async () => {
      setError(null);
      const amount = text.trim() === "" ? 0 : parseRupeeInput(text);
      if (amount === null) return setError(t("Enter an amount like 500"));
      try {
        if ((await setTodayOpeningCash(text)) !== "ok") {
          return setError(t("Enter an amount like 500"));
        }
      } catch {
        return setError(t("Needs internet. You can also fix it when you close the day."));
      }
      await patchSnapshot((s) =>
        s.close && s.date === today ? { ...s, close: { ...s.close, openingCash: amount } } : s,
      );
      markChecked();
    });

  return (
    <Card className="gap-2.5 py-3.5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
          <Sunrise size={20} aria-hidden />
        </span>
        <span className="flex flex-col">
          <span className="text-[15px] font-bold">
            {t("Start of day: is {amount} in the drawer?", { amount: formatRupees(openingCash) })}
          </span>
          <span className="text-xs text-muted">
            {t("Count it once, so the drawer figure stays right all day.")}
          </span>
        </span>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="opening-count" className="text-xs font-semibold text-muted">
            {t("Cash in the drawer now (₹)")}
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              id="opening-count"
              inputMode="decimal"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={String(openingCash / 100)}
              className="h-11 min-w-0 rounded-control border border-edge bg-field px-3 text-base"
            />
            <Button type="button" onClick={save} disabled={pending || offline}>
              {pending ? t("Saving…") : t("Save")}
            </Button>
          </div>
          {(error || offline) && (
            <p role="status" className="text-xs font-semibold text-danger">
              {error ?? t("Needs internet. You can also fix it when you close the day.")}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" onClick={markChecked}>
            {t("Yes, correct")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setEditing(true)}>
            {t("No, change")}
          </Button>
        </div>
      )}
    </Card>
  );
}
