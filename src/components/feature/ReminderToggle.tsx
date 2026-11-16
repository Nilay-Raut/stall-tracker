"use client";

import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { useT } from "@/i18n/client";
import { turnOffReminder, turnOnReminder } from "@/server/actions/reminders";

type Status = "checking" | "on" | "off" | "unsupported" | "needs-install";

/** The VAPID public key comes as base64url; the browser wants raw bytes. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** This phone's push subscription, if any. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/**
 * "Remind me at closing time" (Settings). Uses Web Push: free, and the reminder
 * arrives even when the app is closed. On iPhone it needs the app on the Home Screen.
 */
export function ReminderToggle({
  publicKey,
  closingTime,
}: {
  publicKey: string | null;
  closingTime: string;
}) {
  const t = useT();
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const installed = window.matchMedia("(display-mode: standalone)").matches;
      let next: Status;
      if (!supported) next = isIos && !installed ? "needs-install" : "unsupported";
      else next = (await currentSubscription()) ? "on" : "off";
      if (!cancelled) setStatus(next);
    })().catch(() => !cancelled && setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  const turnOn = () =>
    startTransition(async () => {
      setMessage(null);
      if (!publicKey) return setMessage(t("Reminders are not set up on the server yet."));
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return setMessage(
          t("Notifications are blocked. Allow them for this app in the phone's settings."),
        );
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(publicKey),
        });
        const result = await turnOnReminder(subscription.toJSON());
        if (result !== "ok") {
          await subscription.unsubscribe();
          return setMessage(t("Could not switch the reminder on. Try again later."));
        }
        setStatus("on");
      } catch {
        setMessage(t("This browser could not set up notifications."));
      }
    });

  const turnOff = () =>
    startTransition(async () => {
      setMessage(null);
      const subscription = await currentSubscription();
      if (subscription) {
        await turnOffReminder(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("off");
    });

  return (
    <Card className="gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold">{t("Remind me at closing time")}</span>
          <span className="text-xs text-muted">
            {t("A notification at {time} if the day is not closed yet.", { time: closingTime })}
          </span>
        </span>
        {(status === "on" || status === "off") && (
          <button
            type="button"
            role="switch"
            aria-checked={status === "on"}
            aria-label={t("Remind me at closing time")}
            disabled={pending}
            onClick={status === "on" ? turnOff : turnOn}
            className={
              status === "on"
                ? "relative h-8 w-14 shrink-0 rounded-full bg-accent disabled:opacity-50"
                : "relative h-8 w-14 shrink-0 rounded-full bg-track disabled:opacity-50"
            }
          >
            <span
              className={
                status === "on"
                  ? "absolute top-1 left-7 size-6 rounded-full bg-white transition-all"
                  : "absolute top-1 left-1 size-6 rounded-full bg-white transition-all"
              }
            />
          </button>
        )}
      </div>
      {status === "needs-install" && (
        <p className="text-xs text-muted">
          {t(
            "On iPhone, first add the app to the Home Screen (Share, then “Add to Home Screen”), then open it from there. Needs iOS 16.4 or later.",
          )}
        </p>
      )}
      {status === "unsupported" && (
        <p className="text-xs text-muted">{t("This browser cannot show reminders.")}</p>
      )}
      {message && (
        <p role="status" className="text-xs font-semibold text-danger">
          {message}
        </p>
      )}
    </Card>
  );
}
