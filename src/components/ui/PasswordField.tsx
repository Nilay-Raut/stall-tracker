"use client";

import { type ComponentProps, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/client";

type Props = { label: string; hint?: string; error?: string } & Omit<
  ComponentProps<"input">,
  "type"
>;

/** Password or PIN input with a Show / Hide button, handy when typing on a phone. */
export function PasswordField({ label, hint, error, id, name, className, ...props }: Props) {
  const t = useT(); // errors come from the server in English
  const [visible, setVisible] = useState(false);
  const inputId = id ?? name;
  const noteId = hint || error ? `${inputId}-note` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold text-muted">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center rounded-control border-[1.5px] bg-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
          error ? "border-danger" : "border-ink",
        )}
      >
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={noteId}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={inputId}
          aria-pressed={visible}
          className="h-full px-3 text-[13px] font-semibold underline"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {(error || hint) && (
        <span id={noteId} className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {error ? t(error) : hint}
        </span>
      )}
    </div>
  );
}
