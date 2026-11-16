"use client";

import Link from "next/link";
import { useSyncStatus } from "@/client/sync";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";

/** One line under the header saying whether everything is safely on the server. */
export function SyncLine() {
  const { state, waiting, refused } = useSyncStatus();
  const t = useT();

  let text: string;
  let warn = false;
  if (refused > 0) {
    text =
      refused === 1
        ? t("{n} entry could not be saved. See below.", { n: refused })
        : t("{n} entries could not be saved. See below.", { n: refused });
    warn = true;
  } else if (state === "signed-out") {
    text = t("Logged out. Log in again to send your entries.");
    warn = true;
  } else if (waiting > 0) {
    text =
      state === "offline"
        ? t("No internet. {n} saved on this phone, will send when back online.", { n: waiting })
        : t("Sending {n}…", { n: waiting });
  } else {
    text = t("All entries saved");
  }

  return (
    <p
      role="status"
      className={cn("flex items-center gap-2 text-xs", warn ? "text-danger" : "text-muted")}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          warn ? "bg-danger" : waiting > 0 ? "bg-idle" : "bg-accent",
        )}
      />
      {text}
      {state === "signed-out" && (
        <Link href="/login" className="font-semibold underline">
          {t("Log in")}
        </Link>
      )}
    </p>
  );
}
