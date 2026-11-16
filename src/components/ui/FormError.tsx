"use client";

import { useT } from "@/i18n/client";

/**
 * Message for the whole form, read out by screen readers when it appears.
 * Server messages arrive in English and are translated here.
 */
export function FormError({ message }: { message?: string }) {
  const t = useT();
  return (
    <div aria-live="polite">
      {message && (
        <p
          role="alert"
          className="rounded-control border-[1.5px] border-danger px-3 py-2 text-sm font-semibold text-danger"
        >
          {t(message)}
        </p>
      )}
    </div>
  );
}
