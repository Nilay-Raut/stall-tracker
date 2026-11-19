"use client";

import { ShoppingBasket } from "lucide-react";
import { useDailyFlag } from "@/client/dailyFlag";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { RestockHint } from "@/domain/restock";
import { useT } from "@/i18n/client";
import type { BusinessDate } from "@/lib/dates";
import { ENTRY_PATHS } from "@/lib/labels";

/** "Oil: you usually buy it every 4 days. It has been 5." Hidden for the day on request. */
export function RestockNudge({ today, hints }: { today: BusinessDate; hints: RestockHint[] }) {
  const t = useT();
  const [hidden, hide] = useDailyFlag("stall:restock-hidden", today);
  if (hidden !== false || hints.length === 0) return null;

  return (
    <Card className="gap-2 py-3.5">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <ShoppingBasket size={18} aria-hidden className="text-accent-fg" />
        {t("Time to buy?")}
      </h2>
      <ul className="flex flex-col gap-1">
        {hints.map((hint) => (
          <li key={hint.material} className="text-[13px]">
            <span className="font-bold">{hint.material}</span>
            {": "}
            {hint.everyDays === 1
              ? t("you usually buy it every day. It has been {since} days.", {
                  since: hint.daysSince,
                })
              : t("you usually buy it every {every} days. It has been {since} days.", {
                  every: hint.everyDays,
                  since: hint.daysSince,
                })}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <ButtonLink href={ENTRY_PATHS.expense} variant="outline">
          {t("+ Expense")}
        </ButtonLink>
        <button type="button" onClick={hide} className="min-h-10 text-[13px] font-bold underline">
          {t("Hide for today")}
        </button>
      </div>
    </Card>
  );
}
