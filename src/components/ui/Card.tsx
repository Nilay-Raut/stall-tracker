import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Tone = "outline" | "muted" | "dashed";

const tones: Record<Tone, string> = {
  outline: "border-[1.5px] border-ink",
  muted: "bg-surface",
  dashed: "border-[1.5px] border-dashed border-ink",
};

/** The boxed sections used across the wireframe. */
export function Card({
  tone = "outline",
  className,
  ...props
}: { tone?: Tone } & ComponentProps<"section">) {
  return (
    <section
      className={cn("flex flex-col gap-2 rounded-card px-3.5 py-3", tones[tone], className)}
      {...props}
    />
  );
}
