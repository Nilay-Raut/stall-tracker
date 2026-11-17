"use client";

import { useT } from "@/i18n/client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "Del"] as const;
const MAX_DIGITS = 7; // up to ₹99,99,999

/** Big number pad for whole rupees, so the phone keyboard never covers the screen. */
export function Keypad({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const t = useT();
  const press = (key: (typeof KEYS)[number]) => {
    if (key === "Del") return onChange(value.slice(0, -1));
    const next = (value + key).replace(/^0+/, "");
    if (next.length <= MAX_DIGITS) onChange(next);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => press(key)}
          aria-label={key === "Del" ? t("Delete last digit") : undefined}
          className="h-[54px] press rounded-control glass-soft text-[22px] font-semibold active:bg-surface"
        >
          {key === "Del" ? "⌫" : key}
        </button>
      ))}
    </div>
  );
}

/** "+ ₹100" style buttons that add to the amount. */
export function QuickAdd({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[100, 500, 1000].map((step) => (
        <button
          key={step}
          type="button"
          onClick={() => onChange(String(Math.min(Number(value || 0) + step, 9_999_999)))}
          className="h-11 press rounded-full border border-accent/30 bg-accent-soft text-sm font-semibold text-ink"
        >
          + ₹{step.toLocaleString("en-IN")}
        </button>
      ))}
    </div>
  );
}
