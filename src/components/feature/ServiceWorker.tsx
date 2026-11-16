"use client";

import { useEffect } from "react";
import "@/client/install"; // starts listening for the install prompt as early as possible

/**
 * Registers the service worker (production builds only), which keeps the app's
 * own files on the phone so screens open without a network. Renders nothing.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // In development a stale worker would serve old files; make sure none is left.
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((r) => void r.unregister()));
      return;
    }

    const register = () =>
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((error) => console.error("Service worker not registered", error));

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });
  }, []);

  return null;
}
