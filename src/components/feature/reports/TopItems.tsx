"use client";

import Link from "next/link";
import { useState } from "react";
import { ITEM_SORTS, type ItemStat, changeLabel } from "@/domain/salesInsights";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { formatRupees } from "@/lib/money";
import { Sparkline } from "./Sparkline";

type Sort = (typeof ITEM_SORTS)[number]["key"];
const SHOWN = 8;

/** "Top items": switch between sales, quantity and profit. Rows open the item's own report. */
export function TopItems({ stats, query }: { stats: ItemStat[]; query: string }) {
  const t = useT();
  const hasProfit = stats.some((s) => s.profit !== null);
  const sorts = ITEM_SORTS.filter((s) => s.key !== "profit" || hasProfit);
  const [sort, setSort] = useState<Sort>("revenue");

  const value = (s: ItemStat) =>
    sort === "quantity" ? s.quantity : sort === "profit" ? (s.profit ?? -Infinity) : s.revenue;
  const list = [...stats]
    .filter((s) => sort !== "profit" || s.profit !== null)
    .sort((a, b) => value(b) - value(a))
    .slice(0, SHOWN);
  const top = Math.max(...list.map(value), 1);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{t("Top items")}</h2>
        <div
          role="radiogroup"
          aria-label={t("Rank items by")}
          className="flex gap-1 rounded-full bg-surface p-1"
        >
          {sorts.map((s) => (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={sort === s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "min-h-8 press rounded-full px-3 text-xs",
                sort === s.key ? "glass-soft font-bold text-ink" : "font-semibold text-muted",
              )}
            >
              {t(s.label)}
            </button>
          ))}
        </div>
      </div>
      <ol className="flex flex-col rounded-card glass-soft px-3.5 py-1">
        {list.map((s, i) => {
          const change = changeLabel(s.change);
          const shown =
            sort === "quantity"
              ? t("{n} sold", { n: s.quantity })
              : formatRupees(sort === "profit" ? s.profit! : s.revenue);
          return (
            <li key={s.key} className="border-t border-line first:border-t-0">
              <Link
                href={`/reports/items/${encodeURIComponent(s.key)}?${query}`}
                className="flex min-h-14 press items-center gap-3 py-1.5"
              >
                <span className="w-4 text-xs font-bold text-muted">{i + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-semibold">{s.name}</span>
                  {/* Share of the leader, so the ranking reads at a glance. */}
                  <span className="h-1.5 overflow-hidden rounded-full bg-track">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.max((value(s) / top) * 100, 2)}%` }}
                    />
                  </span>
                </span>
                <Sparkline values={s.daily} />
                <span className="flex w-20 flex-col items-end">
                  <span className="font-display text-sm font-bold">{shown}</span>
                  {change && (
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        s.change! > 0 ? "text-accent-fg" : "text-danger",
                      )}
                    >
                      {change}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {stats.length > SHOWN && (
        <p className="text-xs text-muted">
          {t("Top {shown} of {total} items.", { shown: SHOWN, total: stats.length })}
        </p>
      )}
    </section>
  );
}
