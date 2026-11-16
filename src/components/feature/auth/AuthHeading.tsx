"use client";

import { useT } from "@/i18n/client";

/**
 * Heading of the login, register and forgot screens. They are static pages with no
 * shop, so the text is translated on the phone (English keys marked with msg()).
 */
export function AuthHeading({ title, note }: { title: string; note?: string }) {
  const t = useT();
  if (!note) return <h1 className="font-display text-2xl font-bold">{t(title)}</h1>;
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-2xl font-bold">{t(title)}</h1>
      <p className="text-sm text-muted">{t(note)}</p>
    </div>
  );
}
