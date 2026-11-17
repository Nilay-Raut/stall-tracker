"use client";

import { cn } from "@/lib/cn";

export type Choice<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  choices: ReadonlyArray<Choice<T>>;
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
  /** "accent" for the main pick (Cash / UPI, category), "ink" for secondary ones. */
  tone?: "accent" | "ink";
  /** When set, the picked value is sent with the surrounding <form> under this name. */
  name?: string;
};

const columnClass = { 2: "grid-cols-2", 3: "grid-cols-3" } as const;

/**
 * A row of buttons where exactly one is picked: Cash / UPI, expense category,
 * paid from, language. Behaves as a radio group for screen readers.
 */
export function ChoiceGroup<T extends string>({
  label,
  choices,
  value,
  onChange,
  columns = 3,
  tone = "ink",
  name,
}: Props<T>) {
  const selected =
    tone === "accent" ? "border-accent bg-accent text-accent-ink" : "border-ink bg-ink text-paper";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {name && <input type="hidden" name={name} value={value} />}
      <div role="radiogroup" aria-label={label} className={cn("grid gap-2", columnClass[columns])}>
        {choices.map((choice) => {
          const isOn = choice.value === value;
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={isOn}
              onClick={() => onChange(choice.value)}
              className={cn(
                "min-h-12 press rounded-control border px-2 text-[13px]",
                isOn ? cn(selected, "font-bold") : "border-edge bg-field font-semibold text-ink",
              )}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
