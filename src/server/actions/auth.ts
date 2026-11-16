"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isWeakPin } from "@/domain/credentials";
import { type Translate, isLang, msg, translator } from "@/i18n/translate";
import { normalizePhone } from "@/lib/phone";
import { clearFailures, minutesLocked, recordFailure } from "@/server/auth/attempts";
import { hashSecret, verifyAgainstDummy, verifySecret } from "@/server/auth/password";
import { allowRequest } from "@/server/auth/rateLimit";
import { createSession, deleteAllSessions, deleteCurrentSession } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { type FormState, fieldErrorsFrom } from "./formState";

const TOO_MANY_REQUESTS = msg("Too many tries from this device. Wait 15 minutes and try again.");

/** The phone's language, sent by the form, for messages that carry a number. */
const translatorFor = (formData: FormData): Translate => {
  const lang = formData.get("lang");
  return translator(isLang(lang) ? lang : "en");
};

const lockedMessage = (minutes: number, t: Translate) =>
  minutes >= 60
    ? t("Too many wrong tries. Try again in {hours} hours.", { hours: Math.ceil(minutes / 60) })
    : t("Too many wrong tries. Try again in {minutes} minutes.", { minutes });

// ---------- Field rules ----------

const phoneField = z.string().transform((value, ctx) => {
  const phone = normalizePhone(value);
  if (!phone) {
    ctx.addIssue({ code: "custom", message: msg("Enter a 10-digit mobile number.") });
    return z.NEVER;
  }
  return phone;
});

const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, msg("Use at least 8 characters."))
  .max(PASSWORD_MAX_LENGTH, msg("That password is too long."));

const pinField = z
  .string()
  .regex(/^\d{6}$/, msg("The PIN must be exactly 6 digits."))
  .refine((pin) => !isWeakPin(pin), msg("This PIN is too easy to guess. Choose another."));

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

// ---------- Register ----------

const registerSchema = z
  .object({
    phone: phoneField,
    password: newPasswordField,
    confirmPassword: z.string(),
    pin: pinField,
    confirmPin: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: msg("The passwords do not match."),
  })
  .refine((v) => v.pin === v.confirmPin, {
    path: ["confirmPin"],
    message: msg("The PINs do not match."),
  });

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { phone: field(formData, "phone") };
  if (!(await allowRequest("register"))) return { error: TOO_MANY_REQUESTS, values };

  const parsed = registerSchema.safeParse({
    phone: values.phone,
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
    pin: field(formData, "pin"),
    confirmPin: field(formData, "confirmPin"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { phone, password, pin } = parsed.data;
  const alreadyRegistered = {
    fieldErrors: {
      phone: msg("This number is already registered. Log in or reset your password."),
    },
    values,
  };

  const db = getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone));
  if (existing) return alreadyRegistered;

  const [passwordHash, recoveryPinHash] = await Promise.all([
    hashSecret(password),
    hashSecret(pin),
  ]);
  const [user] = await db
    .insert(users)
    .values({ phone, passwordHash, recoveryPinHash })
    .onConflictDoNothing({ target: users.phone }) // two sign-ups at the same moment
    .returning({ id: users.id });
  if (!user) return alreadyRegistered;

  await createSession(user.id);
  redirect("/setup");
}

// ---------- Login ----------

const WRONG_LOGIN = msg("Mobile number or password is wrong.");

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { phone: field(formData, "phone") };
  if (!(await allowRequest("login"))) return { error: TOO_MANY_REQUESTS, values };

  const phone = normalizePhone(values.phone);
  const password = field(formData, "password");
  if (!phone || !password) return { error: WRONG_LOGIN, values };

  const locked = await minutesLocked(phone, "login");
  if (locked) return { error: lockedMessage(locked, translatorFor(formData)), values };

  const [user] = await getDb()
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.phone, phone));

  const ok = user
    ? await verifySecret(user.passwordHash, password)
    : await verifyAgainstDummy(password);

  if (!user || !ok) {
    await recordFailure(phone, "login");
    return { error: WRONG_LOGIN, values };
  }

  await clearFailures(phone, "login");
  await createSession(user.id);
  redirect("/");
}

// ---------- Forgot password ----------

const WRONG_RECOVERY = msg("Mobile number or recovery PIN is wrong.");

const resetSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: msg("The passwords do not match."),
  });

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { phone: field(formData, "phone") };
  if (!(await allowRequest("reset"))) return { error: TOO_MANY_REQUESTS, values };

  const phone = normalizePhone(values.phone);
  const pin = field(formData, "pin");
  if (!phone || !/^\d{6}$/.test(pin)) return { error: WRONG_RECOVERY, values };

  // Check the new password first so a typo does not use up a PIN try.
  const parsed = resetSchema.safeParse({
    password: field(formData, "password"),
    confirmPassword: field(formData, "confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const locked = await minutesLocked(phone, "recovery");
  if (locked) return { error: lockedMessage(locked, translatorFor(formData)), values };

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, recoveryPinHash: users.recoveryPinHash })
    .from(users)
    .where(eq(users.phone, phone));

  const ok = user ? await verifySecret(user.recoveryPinHash, pin) : await verifyAgainstDummy(pin);

  if (!user || !ok) {
    await recordFailure(phone, "recovery");
    return { error: WRONG_RECOVERY, values };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashSecret(parsed.data.password) })
    .where(eq(users.id, user.id));

  // Anyone else who was logged in with the old password is logged out.
  await deleteAllSessions(user.id);
  await Promise.all([clearFailures(phone, "recovery"), clearFailures(phone, "login")]);
  await createSession(user.id);
  redirect("/");
}

// ---------- Logout ----------

export async function logout(): Promise<void> {
  await deleteCurrentSession();
  redirect("/login");
}
