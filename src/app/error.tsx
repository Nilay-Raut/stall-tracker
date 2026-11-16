"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

/**
 * Shown when a screen fails to load. Entries saved on the phone are safe, so the
 * message says so; the code helps find the error in the server logs.
 */
export default function ErrorScreen({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useT();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="font-display text-2xl font-bold">{t("Something went wrong")}</h1>
      <p className="text-muted">
        {t("This screen could not load. Your saved entries are safe. Try again.")}
      </p>
      <div className="flex w-full flex-col gap-2">
        <Button type="button" onClick={() => retry()}>
          {t("Try again")}
        </Button>
        <ButtonLink href="/" variant="outline">
          {t("Back to Today")}
        </ButtonLink>
      </div>
      {error.digest && (
        <p className="text-xs text-muted">{t("Error code: {code}", { code: error.digest })}</p>
      )}
    </main>
  );
}
