// Prints new values for the server secrets it is asked for, as KEY=value lines.
// Used by deploy/deploy.sh on the server for secrets missing from /opt/stall/.env:
//   node tools/scripts/generate-secrets.mjs CRON_SECRET VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY
// No packages needed: Node's own crypto makes the Web Push (VAPID) key pair.
import { generateKeyPairSync, randomBytes } from "node:crypto";

const wanted = new Set(process.argv.slice(2));
const lines = [];

if (wanted.has("CRON_SECRET")) {
  lines.push(`CRON_SECRET=${randomBytes(32).toString("hex")}`);
}

if (wanted.has("VAPID_PUBLIC_KEY") || wanted.has("VAPID_PRIVATE_KEY")) {
  // A P-256 key pair, in the form browsers and web-push expect (base64url).
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const pub = publicKey.export({ format: "jwk" });
  const priv = privateKey.export({ format: "jwk" });
  const raw = Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(pub.x, "base64url"),
    Buffer.from(pub.y, "base64url"),
  ]);
  lines.push(`VAPID_PUBLIC_KEY=${raw.toString("base64url")}`);
  lines.push(`VAPID_PRIVATE_KEY=${priv.d}`);
}

process.stdout.write(lines.join("\n") + (lines.length ? "\n" : ""));
