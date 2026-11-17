import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * - outline: everyday glass card (no blur, cheap to draw)
 * - muted: the hero card of a screen, real blurred glass
 * - dashed: optional or "add something" sections
 */
type Tone = "outline" | "muted" | "dashed";

const tones: Record<Tone, string> = {
  outline: "glass-soft",
  muted: "glass",
  dashed: "border border-dashed border-edge bg-surface",
};

/** The boxed sections used across the app. */
export function Card({
  tone = "outline",
  className,
  ...props
}: { tone?: Tone } & ComponentProps<"section">) {
  return (
    <section
      className={cn("flex flex-col gap-2 rounded-card px-4 py-3.5", tones[tone], className)}
      {...props}
    />
  );
}
