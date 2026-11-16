"use client";

import { useOffline } from "next/offline";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * True when the phone has no connection: the browser says so, or Next saw a
 * request fail (which also catches Wi-Fi without internet).
 */
export function useIsOffline(): boolean {
  const browserOffline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  return useOffline() || browserOffline;
}

/**
 * Screens the service worker should keep ready for offline use. Today ("/") is
 * included because the first visit happens before the service worker is in charge.
 */
export const OFFLINE_SCREENS = ["/", "/add/sale", "/add/expense", "/add/cash-out", "/close/today"];

/** Asks the service worker to store the plain screens (call once logged in). */
export function storeOfflineScreens(): void {
  navigator.serviceWorker?.controller?.postMessage({ type: "store-pages", paths: OFFLINE_SCREENS });
}

/** Deletes stored page copies (they can hold shop data). Used at logout. */
export async function deleteStoredPages(): Promise<void> {
  if (typeof caches === "undefined") return;
  const names = await caches.keys();
  await Promise.all(names.filter((n) => n.startsWith("pages-")).map((n) => caches.delete(n)));
}
