"use client";

import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useT } from "@/i18n/client";

/** Header of Supplier prices; part of the static page, so it reads the phone's language. */
export function PricesHeader() {
  const t = useT();
  return (
    <ScreenHeader title={t("Supplier prices")} back={{ href: "/reports", label: t("Reports") }} />
  );
}
