import type { z } from "zod";

/** What a form's Server Action sends back to the form when something is wrong. */
export type FormState = {
  /** Message for the whole form. */
  error?: string;
  /** Message per field, keyed by the input's name. */
  fieldErrors?: Record<string, string | undefined>;
  /** Safe values to put back in the form. Never passwords or PINs. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

/** First Zod message for each field. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}
