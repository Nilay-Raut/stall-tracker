import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * Encrypts payment provider secrets (PhonePe salt key, the callback token) with
 * PAYMENTS_KEY, using AES-256-GCM: a stolen database copy alone reveals nothing.
 * Sealed text: "v1.<iv>.<tag>.<ciphertext>", each part base64url.
 */

function key(): Buffer {
  const raw = serverEnv().PAYMENTS_KEY;
  if (!raw) throw new Error("PAYMENTS_KEY is not set");
  const bytes = Buffer.from(raw, "base64url");
  if (bytes.length !== 32) throw new Error("PAYMENTS_KEY must be 32 bytes (base64url)");
  return bytes;
}

/** Payments can be connected only when the server has its key. */
export function paymentsAvailable(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function seal(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
}

export function open(sealed: string): string {
  const [version, iv, tag, data] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || data === undefined) throw new Error("Not a sealed value");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** How a callback token is looked up: only its hash is stored in clear. */
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export const newToken = () => randomBytes(24).toString("base64url");
