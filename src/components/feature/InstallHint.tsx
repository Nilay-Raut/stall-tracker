"use client";

import { useState, useSyncExternalStore } from "react";
import { isInstalled, promptInstall, useCanInstall } from "@/client/install";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

const DISMISSED_KEY = "stall:install-hint-dismissed";

const noSubscribe = () => () => {};

/** What kind of browser this is, read once in the browser (null on the server). */
function readPlatform(): "installed" | "ios" | "other" {
  if (isInstalled()) return "installed";
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && "standalone" in navigator
    ? "ios"
    : "other";
}

function readDismissed(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false; // storage blocked: just show the hint
  }
}

/**
 * Suggests installing the app: a button on Android (Chrome's own dialog), and
 * the Share > "Add to Home Screen" steps on iPhone. Hidden once installed or dismissed.
 */
export function InstallHint() {
  const canInstall = useCanInstall();
  const t = useT();
  const platform = useSyncExternalStore(noSubscribe, readPlatform, () => null);
  const [dismissed, setDismissed] = useState(readDismissed);

  const show =
    !platform || platform === "installed" || dismissed
      ? null
      : canInstall
        ? "android"
        : platform === "ios"
          ? "ios"
          : null;
  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage blocked: the hint only hides for now.
    }
    setDismissed(true);
  };

  return (
    <section className="flex items-center justify-between gap-3 rounded-card border border-dashed border-edge px-3.5 py-2.5">
      <span className="flex flex-col">
        <span className="text-sm font-bold">{t("Add the app to your phone")}</span>
        <span className="text-xs text-muted">
          {show === "android"
            ? t("Opens like an app and works without internet.")
            : t("Tap Share, then “Add to Home Screen”.")}
        </span>
      </span>
      <span className="flex items-center gap-1">
        {show === "android" && (
          <Button className="min-h-10 px-3 text-[13px]" onClick={() => void promptInstall()}>
            {t("Install")}
          </Button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("Hide this suggestion")}
          className="size-10 text-lg text-muted"
        >
          ×
        </button>
      </span>
    </section>
  );
}
