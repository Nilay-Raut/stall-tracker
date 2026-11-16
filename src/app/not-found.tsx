"use client";

import { ButtonLink } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

export default function NotFound() {
  const t = useT();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="font-display text-2xl font-bold">{t("Page not found")}</h1>
      <p className="text-muted">{t("This screen does not exist.")}</p>
      <ButtonLink href="/">{t("Back to Today")}</ButtonLink>
    </main>
  );
}
