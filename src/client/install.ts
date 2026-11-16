"use client";

import { useSyncExternalStore } from "react";

/** Chrome's install prompt event (not in the standard DOM types). */
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

// Caught as early as possible: Chrome fires it once, often before Today has loaded.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // show our own button instead of Chrome's bar
    deferred = event as InstallPromptEvent;
    changed();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    changed();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when Android/Chrome offers installing the app right now. */
export function useCanInstall(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => deferred !== null,
    () => false,
  );
}

/** Opens the browser's install dialog. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  deferred = null;
  changed();
  await event?.prompt();
}

/** Running as the installed app (from the Home Screen)? */
export function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
