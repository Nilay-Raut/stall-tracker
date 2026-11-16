"use client";

import { useEffect } from "react";
import { cleanUpOldEntries, requestSync } from "@/client/sync";

/**
 * When the app opens: tidies old entries off the phone and starts a sync.
 * Also syncs when the network comes back and when the app returns to the front.
 * Renders nothing.
 */
export function SyncRunner() {
  useEffect(() => {
    void cleanUpOldEntries().catch(() => {});
    requestSync();
    const onVisible = () => {
      if (document.visibilityState === "visible") requestSync();
    };
    window.addEventListener("online", requestSync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", requestSync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
