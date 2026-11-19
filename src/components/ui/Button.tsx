import type Link from "next/link";
import { AppLink } from "./AppLink";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "dashed" | "ghost";
type Size = "md" | "lg";

type StyleProps = { variant?: Variant; size?: Size; className?: string };

const base =
  "press inline-flex items-center justify-center gap-2 font-semibold no-underline " +
  "disabled:opacity-40 disabled:active:scale-100 aria-disabled:pointer-events-none aria-disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink font-bold shadow-lift " +
    "bg-[linear-gradient(180deg,rgb(255_255_255/0.16),transparent)]",
  outline: "glass-soft text-ink",
  dashed: "border border-dashed border-edge bg-surface text-ink",
  ghost: "bg-transparent text-ink underline",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 rounded-control px-4 text-[15px]",
  lg: "min-h-14 rounded-cta px-5 text-[17px]",
};

export function buttonClass({ variant = "primary", size = "md", className }: StyleProps): string {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: StyleProps & ComponentProps<"button">) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}

/** A link that looks like a button, for moving to another screen. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: StyleProps & ComponentProps<typeof Link>) {
  return <AppLink className={buttonClass({ variant, size, className })} {...props} />;
}
