"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/client";

type Props = { label: string; hint?: string; error?: string } & Omit<
  ComponentProps<"input">,
  "type"
>;

/**
 * Large rupee field: Amount, Cash in drawer, UPI total.
 * Works inside a plain <form>; the value is read and checked on the server.
 */
export function MoneyInput({ label, hint, error, id, name, className, ...props }: Props) {
  const t = useT(); // errors come from the server in English
  const inputId = id ?? name;
  const hintId = hint || error ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold text-muted">
        {label}
      </label>
      <div
        className={cn(
          "flex h-13 items-center rounded-control border bg-field px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
          error ? "border-danger" : "border-edge",
        )}
      >
        <span aria-hidden className="font-display text-[26px] font-bold">
          ₹
        </span>
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={hintId}
          className={cn(
            "min-w-0 flex-1 bg-transparent font-display text-[26px] font-bold outline-none",
            className,
          )}
          {...props}
        />
      </div>
      {(error || hint) && (
        <span id={hintId} className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {error ? t(error) : hint}
        </span>
      )}
    </div>
  );
}
