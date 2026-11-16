"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/TextField";
import { login } from "@/server/actions/auth";
import { initialFormState } from "@/server/actions/formState";
import { useLang, useT } from "@/i18n/client";

export function LoginForm() {
  const t = useT();
  const lang = useLang();
  const [state, formAction, pending] = useActionState(login, initialFormState);

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
        label={t("Password")}
        name="password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("Logging in…") : t("Log in")}
      </Button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot" className="font-semibold underline">
          {t("Forgot password?")}
        </Link>
        <Link href="/register" className="font-semibold underline">
          {t("New here? Register")}
        </Link>
      </div>
    </form>
  );
}
