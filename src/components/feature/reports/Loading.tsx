"use client";

import { useT } from "@/i18n/client";

/** "Loading…" while a screen's data comes, in the phone's language. */
export function Loading() {
  const t = useT();
  return <p className="py-10 text-center text-sm text-muted">{t("Loading…")}</p>;
}
