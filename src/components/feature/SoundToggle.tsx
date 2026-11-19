"use client";

import { Volume2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { playCue, setSoundsOn, soundsOn, subscribeSounds } from "@/client/sound";
import { Card } from "@/components/ui/Card";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";

/** "Sounds" switch in Settings. Kept on this phone only, like the dark mode choice. */
export function SoundToggle() {
  const t = useT();
  const on = useSyncExternalStore(subscribeSounds, soundsOn, () => true);

  const toggle = () => {
    setSoundsOn(!on);
    if (!on) playCue("sale", { force: true }); // a sample, so the owner hears what it is
  };

  return (
    <Card className="gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
            <Volume2 size={20} aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold">{t("Sounds")}</span>
            <span className="text-xs text-muted">
              {t(
                "A short sound when a sale is saved, a UPI payment comes in or it is closing time.",
              )}
            </span>
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t("Sounds")}
          onClick={toggle}
          className={cn("relative h-8 w-14 shrink-0 rounded-full", on ? "bg-accent" : "bg-track")}
        >
          <span
            className={cn(
              "absolute top-1 size-6 rounded-full bg-white transition-all",
              on ? "left-7" : "left-1",
            )}
          />
        </button>
      </div>
    </Card>
  );
}
