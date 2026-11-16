"use client";

import { useEffect } from "react";
import { applySnapshot } from "@/client/entries";
import type { ShopSnapshot } from "@/client/localDb";
import type { Entry } from "@/domain/entry";
import { setLang } from "@/i18n/client";

/** Saves the server's fresh data on the phone. Each server render brings new props. */
export function SnapshotLoader({
  snapshot,
  entries,
}: {
  snapshot: ShopSnapshot;
  entries: Entry[];
}) {
  useEffect(() => {
    if (snapshot.language) setLang(snapshot.language);
    applySnapshot(snapshot, entries).catch((error) => {
      console.error("Could not store the latest data on this phone", error);
    });
  }, [snapshot, entries]);

  return null;
}
