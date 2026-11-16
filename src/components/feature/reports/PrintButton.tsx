"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

/** Opens the print dialog; "Save as PDF" is one of its printers on phones and computers. */
export function PrintButton() {
  const t = useT();
  return (
    <Button type="button" onClick={() => window.print()} className="print:hidden">
      {t("Print or save as PDF")}
    </Button>
  );
}
