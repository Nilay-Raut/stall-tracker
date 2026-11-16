import "server-only";
import { hash, verify } from "@node-rs/argon2";

// argon2id with the library defaults (19 MiB memory, 2 passes), the OWASP
// recommended setting. Used for both passwords and recovery PINs.

export function hashSecret(secret: string): Promise<string> {
  return hash(secret);
}

export async function verifySecret(storedHash: string, secret: string): Promise<boolean> {
  try {
    return await verify(storedHash, secret);
  } catch {
    return false; // malformed hash: treat as a wrong secret
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Runs a real verify against a throwaway hash and always returns false.
 * Called when the phone number is not registered, so a wrong number takes
 * as long as a wrong password and response times reveal nothing.
 */
export async function verifyAgainstDummy(secret: string): Promise<false> {
  dummyHash ??= hash("timing-equaliser-not-a-real-password");
  await verifySecret(await dummyHash, secret);
  return false;
}
