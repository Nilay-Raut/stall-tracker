"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { BusinessDate } from "@/lib/dates";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * A yes/no kept on this phone for one day ("drawer checked today", "restock hidden
 * today"). It resets by itself the next day. Null until read in the browser.
 */
export function useDailyFlag(
  key: string,
  today: BusinessDate | null,
): [boolean | null, () => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      if (!today) return null;
      try {
        return localStorage.getItem(key) === today;
      } catch {
        return false; // storage blocked: ask again after a reload, which is harmless
      }
    },
    () => null,
  );

  const mark = useCallback(() => {
    if (!today) return;
    try {
      localStorage.setItem(key, today);
    } catch {
      // see above
    }
    for (const listener of listeners) listener();
  }, [key, today]);

  return [value, mark];
}
