"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { PASSWORD_MIN_LENGTH } from "@/domain/credentials";
import { resetPassword } from "@/server/actions/auth";
import { initialFormState } from "@/server/actions/formState";
import { useLang, useT } from "@/i18n/client";

export function ForgotForm() {
  const t = useT();
  const lang = useLang();
  const [state, formAction, pending] = useActionState(resetPassword, initialFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <FormError message={state.error} />
      <TextField
        label={t("Mobile number")}
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        defaultValue={state.values?.phone}
        required
      />
      <PasswordField
        label={t("Recovery PIN")}
        name="pin"
        inputMode="numeric"
        maxLength={6}
        autoComplete="off"
        hint={t("The 6-digit PIN you chose when you registered.")}
        required
      />
      <PasswordField
        label={t("New password")}
        name="password"
        autoComplete="new-password"
        hint={t("At least {n} characters.", { n: PASSWORD_MIN_LENGTH })}
        error={errors.password}
        required
      />
      <PasswordField
        label={t("New password again")}
        name="confirmPassword"
        autoComplete="new-password"
        error={errors.confirmPassword}
        required
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("Saving…") : t("Set new password")}
      </Button>
      <p className="text-sm text-muted">
        {t(
          "This logs you out on every other phone. Forgot the PIN too? Contact the person who set up the app for you.",
        )}
      </p>
      <Link href="/login" className="text-center text-sm font-semibold underline">
        {t("Back to log in")}
      </Link>
    </form>
  );
}
