"use client";

import { useT } from "@/i18n/client";
import "./globals.css";

/** Last resort when even the app frame fails: its own page, plain and readable. */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useT();
  return (
    <html lang="en">
      <body>
        <title>Stall Tracker</title>
        <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 px-5 text-center">
          <h1 className="text-2xl font-bold">{t("Something went wrong")}</h1>
          <p>{t("The app could not start. Your saved entries are safe. Try again.")}</p>
          <button
            type="button"
            onClick={() => retry()}
            className="h-12 w-full rounded-control bg-ink font-semibold text-white"
          >
            {t("Try again")}
          </button>
          {error.digest && (
            <p className="text-xs">{t("Error code: {code}", { code: error.digest })}</p>
          )}
        </main>
      </body>
    </html>
  );
}
