"use client";

import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useT } from "@/i18n/client";

/**
 * Header of a screen under Reports, with "‹ Reports". Part of the static page, so it
 * reads the phone's language. `title` is an English key, marked with msg().
 */
export function SubHeader({ title, back = "/reports" }: { title: string; back?: string }) {
  const t = useT();
  return <ScreenHeader title={t(title)} back={{ href: back, label: t("Reports") }} />;
}
