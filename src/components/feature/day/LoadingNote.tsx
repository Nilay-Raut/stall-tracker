"use client";

import { useT } from "@/i18n/client";

/** "Loading…" in the phone's language, for Suspense fallbacks on server pages. */
export function LoadingNote() {
  const t = useT();
  return <p className="py-10 text-center text-sm text-muted">{t("Loading…")}</p>;
}
