"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Notice } from "@/components/ui/Notice";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { PASSWORD_MIN_LENGTH } from "@/domain/credentials";
import { register } from "@/server/actions/auth";
import { initialFormState } from "@/server/actions/formState";
import { useLang, useT } from "@/i18n/client";

export function RegisterForm() {
  const t = useT();
  const lang = useLang();
  const [state, formAction, pending] = useActionState(register, initialFormState);
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
        error={errors.phone}
        required
      />
      <PasswordField
        label={t("Password")}
        name="password"
        autoComplete="new-password"
        hint={t("At least {n} characters.", { n: PASSWORD_MIN_LENGTH })}
        error={errors.password}
        required
      />
      <PasswordField
        label={t("Password again")}
        name="confirmPassword"
        autoComplete="new-password"
        error={errors.confirmPassword}
        required
      />

      <Notice title={t("Recovery PIN")}>
        {t(
          "If you forget your password, this 6-digit PIN is the only way to set a new one. Write it down and keep it safe.",
        )}
      </Notice>
      <PasswordField
        label={t("Recovery PIN (6 digits)")}
        name="pin"
        inputMode="numeric"
        maxLength={6}
        autoComplete="off"
        error={errors.pin}
        required
      />
      <PasswordField
        label={t("Recovery PIN again")}
        name="confirmPin"
        inputMode="numeric"
        maxLength={6}
        autoComplete="off"
        error={errors.confirmPin}
        required
      />

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("Creating account…") : t("Create account")}
      </Button>
      <p className="text-center text-sm">
        {t("Already registered?")}{" "}
        <Link href="/login" className="font-semibold underline">
          {t("Log in")}
        </Link>
      </p>
    </form>
  );
}
