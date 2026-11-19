import type { Paise } from "@/lib/money";

export const MAX_QUICK_AMOUNTS = 6;
/** An amount must have been typed this often to be offered. */
const MIN_USES = 2;

/**
 * The sale amounts this shop types most (whole rupees only), offered as one-tap
 * buttons on the quick sale screen. Shown smallest first, so they read like a price list.
 */
export function commonAmounts(amounts: ReadonlyArray<Paise>, limit = MAX_QUICK_AMOUNTS): Paise[] {
  const counts = new Map<Paise, number>();
  for (const amount of amounts) {
    if (amount <= 0 || amount % 100 !== 0) continue;
    counts.set(amount, (counts.get(amount) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_USES)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([amount]) => amount)
    .sort((a, b) => a - b);
}
