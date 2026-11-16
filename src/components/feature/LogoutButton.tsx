"use client";

import { useTransition } from "react";
import { localDb, wipeLocalData } from "@/client/localDb";
import { deleteStoredPages } from "@/client/online";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";
import { logout } from "@/server/actions/auth";
import { turnOffReminder } from "@/server/actions/reminders";
import { currentSubscription } from "./ReminderToggle";

/**
 * Logs out and clears everything this app stored on the phone, so the next
 * person to use the phone cannot see this shop's entries. Warns first if some
 * entries have not reached the server yet, because they would be lost.
 */
export function LogoutButton() {
  const t = useT();
  const [pending, startTransition] = useTransition();

  const onClick = () =>
    startTransition(async () => {
      let unsent = 0;
      try {
        unsent = await (await localDb()).count("outbox");
      } catch {
        // Storage unavailable: nothing stored to lose.
      }
      if (
        unsent > 0 &&
        !window.confirm(
          unsent === 1
            ? t(
                "1 entry has not reached the server yet and will be lost. Connect to the internet first to keep them. Log out anyway?",
              )
            : t(
                "{n} entries have not reached the server yet and will be lost. Connect to the internet first to keep them. Log out anyway?",
                { n: unsent },
              ),
        )
      ) {
        return;
      }
      // Stop reminders on this phone, then clear everything stored on it.
      const subscription = await currentSubscription().catch(() => null);
      if (subscription) {
        await turnOffReminder(subscription.endpoint).catch(() => {});
        await subscription.unsubscribe().catch(() => {});
      }
      await Promise.all([wipeLocalData().catch(() => {}), deleteStoredPages().catch(() => {})]);
      await logout();
    });

  return (
    <div className="flex justify-center">
      <Button variant="ghost" onClick={onClick} disabled={pending}>
        {pending ? t("Logging out…") : t("Log out")}
      </Button>
    </div>
  );
}
