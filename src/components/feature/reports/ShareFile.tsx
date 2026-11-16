"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

/**
 * Gets a CSV from the server and opens the phone's share sheet (WhatsApp, email,
 * Drive …). Where sharing files is not supported (most computers) it downloads instead.
 */
export function ShareFile({
  url,
  fileName,
  label,
}: {
  url: string;
  fileName: string;
  label: string;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function share() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const file = new File([await response.blob()], fileName, { type: "text/csv" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
      }
    } catch (error) {
      // Closing the share sheet is not a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" onClick={share} disabled={busy}>
        {busy ? t("Getting the file…") : label}
      </Button>
      {failed && (
        <p role="alert" className="text-xs font-semibold text-danger">
          {t("Could not get the file. Check the internet and try again.")}
        </p>
      )}
    </div>
  );
}
