"use client";

import { CircleCheck, Link2, Send } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError } from "@/components/ui/FormError";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { useLang, useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { formatDayLabel, formatTime } from "@/lib/dates";
import {
  type TestResult,
  disconnectPayments,
  savePaymentDetails,
  sendTestPayment,
  startPayments,
} from "@/server/actions/payments";
import { initialFormState } from "@/server/actions/formState";
import { CopyField } from "./CopyField";

type Field = { key: string; label: string; secret: boolean; inputMode?: "text" | "numeric" };

type Props = {
  provider: { id: string; name: string; askMessage: string; fields: Field[] };
  /** none: not started; waiting: address made, details not saved; connected: ready. */
  state: "none" | "waiting" | "connected";
  callbackUrl: string | null;
  /** Saved non-secret values (Merchant ID, salt index), to fill the form. */
  saved: Record<string, string>;
  lastEventAt: string | null;
  lastTestAt: string | null;
  /** False when the server has no PAYMENTS_KEY. */
  available: boolean;
};

/** Settings > UPI payments > PhonePe: four short steps, each unlocking the next. */
export function PaymentSetup({
  provider,
  state,
  callbackUrl,
  saved,
  lastEventAt,
  lastTestAt,
  available,
}: Props) {
  const t = useT();
  const lang = useLang();
  const [starting, startStart] = useTransition();
  const [testing, startTest] = useTransition();
  const [test, setTest] = useState<TestResult | null>(null);
  const [form, formAction, saving] = useActionState(
    savePaymentDetails.bind(null, provider.id),
    initialFormState,
  );
  const errors = form.fieldErrors ?? {};
  const values = { ...saved, ...(form.values ?? {}) };
  const when = (iso: string) =>
    `${formatDayLabel(iso.slice(0, 10), lang)}, ${formatTime(iso, lang)}`;

  if (!available) {
    return (
      <Notice title={t("UPI payments are not switched on for this app yet.")}>
        {t(
          "The server needs its payments key. Ask whoever runs the app to deploy the latest version.",
        )}
      </Notice>
    );
  }

  return (
    <>
      {state === "connected" && (
        <section
          className="flex items-center gap-3 rounded-card glass px-4 py-3.5"
          aria-live="polite"
        >
          <CircleCheck size={26} aria-hidden className="shrink-0 text-accent-fg" />
          <span className="flex flex-col">
            <span className="text-sm font-bold">
              {t("{name} is connected", { name: provider.name })}
            </span>
            <span className="text-xs text-muted">
              {lastEventAt
                ? t("Last payment received {when}.", { when: when(lastEventAt) })
                : t("UPI payments to your PhonePe QR will appear as sales by themselves.")}
            </span>
          </span>
        </section>
      )}

      <Step
        n={1}
        title={t("Get your {name} address", { name: provider.name })}
        done={state !== "none"}
      >
        {callbackUrl ? (
          <CopyField label={t("Your callback address (keep it private)")} value={callbackUrl} />
        ) : (
          <>
            <p className="text-[13px] text-muted">
              {t(
                "{name} sends each payment to this address. It is secret and only for your shop.",
                {
                  name: provider.name,
                },
              )}
            </p>
            <Button
              disabled={starting}
              onClick={() => startStart(() => startPayments(provider.id))}
            >
              <Link2 size={18} aria-hidden />
              {starting ? t("Saving…") : t("Get my address")}
            </Button>
          </>
        )}
      </Step>

      {callbackUrl && (
        <Step
          n={2}
          title={t("Ask {name} to switch it on", { name: provider.name })}
          done={state === "connected"}
        >
          <p className="text-[13px] text-muted">
            {t(
              "Send this to {name} Business support (Help in the {name} Business app) or your {name} contact.",
              {
                name: provider.name,
              },
            )}
          </p>
          <CopyField
            label={t("Message")}
            value={t(provider.askMessage, { url: callbackUrl })}
            multiline
          />
        </Step>
      )}

      {callbackUrl && (
        <Step
          n={3}
          title={t("Paste what {name} sends you", { name: provider.name })}
          done={state === "connected"}
        >
          <form action={formAction} className="flex flex-col gap-3">
            {provider.fields.map((field) => (
              <TextField
                key={`${field.key}-${state}`}
                label={t(field.label)}
                name={field.key}
                defaultValue={field.secret ? "" : values[field.key]}
                placeholder={
                  field.secret && state === "connected"
                    ? t("Saved. Type again to change.")
                    : undefined
                }
                inputMode={field.inputMode === "numeric" ? "numeric" : undefined}
                autoComplete="off"
                spellCheck={false}
                error={errors[field.key]}
              />
            ))}
            <FormError message={form.error} />
            <Button type="submit" disabled={saving}>
              {saving
                ? t("Saving…")
                : state === "connected"
                  ? t("Save changes")
                  : t("Save and connect")}
            </Button>
          </form>
        </Step>
      )}

      {state === "connected" && (
        <Step n={4} title={t("Check it works")} done={!!lastTestAt || !!test?.ok}>
          <p className="text-[13px] text-muted">
            {t(
              "Sends a pretend ₹1 payment through the same checks as a real one. No sale is added.",
            )}
          </p>
          <Button
            variant="outline"
            disabled={testing}
            onClick={() => startTest(async () => setTest(await sendTestPayment(provider.id)))}
          >
            <Send size={18} aria-hidden />
            {testing ? t("Sending…") : t("Send a test")}
          </Button>
          {test && (
            <p
              role="status"
              className={cn("text-sm font-semibold", test.ok ? "text-accent-fg" : "text-danger")}
            >
              {t(test.message)}
            </p>
          )}
          <p className="text-xs text-muted">
            {t("Then pay ₹1 to your shop's PhonePe QR: it should show on Today within a minute.")}
          </p>
        </Step>
      )}

      {state !== "none" && (
        <Button
          variant="ghost"
          onClick={() => {
            if (
              window.confirm(
                t("Disconnect {name}? Sales already added stay.", { name: provider.name }),
              )
            ) {
              void disconnectPayments(provider.id);
            }
          }}
        >
          {t("Disconnect {name}", { name: provider.name })}
        </Button>
      )}
    </>
  );
}

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-3">
      <h2 className="flex items-center gap-2.5 text-[15px] font-bold">
        <span
          aria-hidden
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-bold",
            done ? "bg-accent text-accent-ink" : "bg-surface text-ink",
          )}
        >
          {done ? "✓" : n}
        </span>
        {title}
      </h2>
      {children}
    </Card>
  );
}
