// Last-resort reset, for an owner who forgot both the password and the recovery PIN.
// Run only on the server, after confirming the person really owns the number.
//
//   Local:      node --env-file=.env.local scripts/reset-password.mjs 9876543210
//   Production: docker compose exec app node scripts/reset-password.mjs 9876543210
//   Add --pin to also issue a new recovery PIN.
//
// Prints a one-time password (and PIN). Logs the user out everywhere and clears lockouts.

import { randomInt } from "node:crypto";
import { hash } from "@node-rs/argon2";
import postgres from "postgres";

const args = process.argv.slice(2);
const newPin = args.includes("--pin");
const phone = args
  .find((a) => !a.startsWith("--"))
  ?.replace(/\D/g, "")
  .slice(-10);

if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
  console.error("Usage: node scripts/reset-password.mjs <10-digit mobile> [--pin]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// No look-alike characters (0/O, 1/l/I), so it is easy to read out over the phone.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const password = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const pin = String(randomInt(100000, 1000000));

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const [user] = await sql`select id from users where phone = ${phone}`;
  if (!user) {
    console.error(`No account for ${phone}.`);
    process.exitCode = 1;
  } else {
    const passwordHash = await hash(password);
    const pinHash = newPin ? await hash(pin) : null;
    await sql.begin(async (tx) => {
      await tx`update users set password_hash = ${passwordHash},
        recovery_pin_hash = coalesce(${pinHash}, recovery_pin_hash), updated_at = now()
        where id = ${user.id}`;
      await tx`delete from sessions where user_id = ${user.id}`;
      await tx`delete from auth_attempts where phone = ${phone}`;
    });
    console.log(`Reset done for ${phone}. Logged out on all devices.`);
    console.log(`Temporary password: ${password}`);
    if (newPin) console.log(`New recovery PIN:   ${pin}`);
    console.log("Give these to the owner in person or by phone, never by SMS or chat.");
  }
} finally {
  await sql.end();
}
