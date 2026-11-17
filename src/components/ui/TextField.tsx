"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/client";

type Props = { label: string; hint?: string; error?: string } & ComponentProps<"input">;

/** Labelled text input with an optional hint or error underneath. */
export function TextField({ label, hint, error, id, name, className, ...props }: Props) {
  const t = useT(); // errors come from the server in English
  const inputId = id ?? name;
  const noteId = hint || error ? `${inputId}-note` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold text-muted">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={noteId}
        className={cn(
          "h-12 w-full min-w-0 rounded-control border bg-field px-3 text-base",
          error ? "border-danger" : "border-edge",
          className,
        )}
        {...props}
      />
      {(error || hint) && (
        <span id={noteId} className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {error ? t(error) : hint}
        </span>
      )}
    </div>
  );
}
