import "server-only";
import { z } from "zod";

/** An optional setting; an empty value (e.g. from docker compose) counts as not set. */
const optional = (schema: z.ZodString) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Closing-time reminder (Web Push). Without these, reminders are simply off.
  VAPID_PUBLIC_KEY: optional(z.string().min(80)),
  VAPID_PRIVATE_KEY: optional(z.string().min(40)),
  VAPID_SUBJECT: optional(z.string()),
  /** Shared secret for the server's own scheduled job calling /api/cron/reminders. */
  CRON_SECRET: optional(z.string().min(32)),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Server environment, checked on first use.
 * Read lazily so `next build` can run without a database configured.
 */
export function serverEnv(): ServerEnv {
  if (!cached) {
    const result = serverEnvSchema.safeParse(process.env);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Invalid or missing environment variables: ${fields}`);
    }
    cached = result.data;
  }
  return cached;
}
