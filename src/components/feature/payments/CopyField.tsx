"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useT } from "@/i18n/client";

/** Read-only text with a Copy button (callback address, message for the provider). */
export function CopyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard (old browser): the text is selectable instead.
    }
  };
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="flex min-w-0 items-start gap-2 rounded-control border border-edge bg-field p-2.5">
        <span
          className={
            // min-w-0 and wrapping anywhere: a long address must never widen the page.
            multiline
              ? "min-w-0 flex-1 text-[13px] [overflow-wrap:anywhere] whitespace-pre-wrap"
              : "min-w-0 flex-1 text-[13px] [overflow-wrap:anywhere] select-all"
          }
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex min-h-9 shrink-0 press items-center gap-1 rounded-full bg-surface px-3 text-xs font-bold"
        >
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? t("Copied") : t("Copy")}
        </button>
      </div>
    </div>
  );
}
