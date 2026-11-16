import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true }); // DATABASE_URL for the server below

const PORT = 3100;

/**
 * A one-day self-signed certificate for 127.0.0.1, used by the tests' fake push
 * service. The test server trusts exactly this certificate (NODE_EXTRA_CA_CERTS),
 * so TLS checking stays fully on.
 */
function pushServiceCertificate() {
  if (process.env.E2E_PUSH_CERT) return;
  const dir = mkdtempSync(path.join(tmpdir(), "stall-push-"));
  const cert = path.join(dir, "cert.pem");
  const key = path.join(dir, "key.pem");
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "ec",
      "-pkeyopt",
      "ec_paramgen_curve:prime256v1",
      "-nodes",
      "-keyout",
      key,
      "-out",
      cert,
      "-days",
      "1",
      "-subj",
      "/CN=127.0.0.1",
      "-addext",
      "subjectAltName=IP:127.0.0.1",
    ],
    { stdio: "ignore", env: { ...process.env, MSYS_NO_PATHCONV: "1" } },
  );
  process.env.E2E_PUSH_CERT = cert;
  process.env.E2E_PUSH_KEY = key;
}

/**
 * Throwaway reminder secrets for the test server (made once per test run). The
 * tests read E2E_CRON_SECRET to call the reminder job like the server's timer does.
 */
function testSecrets(): Record<string, string> {
  pushServiceCertificate();
  if (!process.env.E2E_CRON_SECRET) {
    const lines = execFileSync(process.execPath, [
      "scripts/generate-secrets.mjs",
      "CRON_SECRET",
      "VAPID_PUBLIC_KEY",
    ])
      .toString()
      .trim()
      .split("\n");
    for (const line of lines) {
      const split = line.indexOf("=");
      process.env[`E2E_${line.slice(0, split)}`] = line.slice(split + 1);
    }
  }
  return {
    CRON_SECRET: process.env.E2E_CRON_SECRET!,
    VAPID_PUBLIC_KEY: process.env.E2E_VAPID_PUBLIC_KEY!,
    VAPID_PRIVATE_KEY: process.env.E2E_VAPID_PRIVATE_KEY!,
  };
}

/**
 * Set E2E_BASE_URL to test an already running deployment instead of starting a
 * local server, e.g. the production stack through Caddy or the real CloudFront URL.
 * E2E_ORIGIN_SECRET adds the header Caddy expects when testing the server directly.
 */
const remoteUrl = process.env.E2E_BASE_URL;
const originSecret = process.env.E2E_ORIGIN_SECRET;

/**
 * Browser tests for whole flows (register, log in, set up ...).
 * They run the same standalone server as production, so run `npm run build`
 * first, and need the local database (`npm run db:up`).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: remoteUrl ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    extraHTTPHeaders: originSecret ? { "X-Origin-Verify": originSecret } : undefined,
  },
  // A phone screen, since that is what the app is built for.
  projects: [{ name: "phone", use: { ...devices["Pixel 7"] } }],
  webServer: remoteUrl
    ? undefined
    : {
        command: "node .next/standalone/server.js",
        url: `http://localhost:${PORT}/api/health`,
        // The suite registers many accounts from one machine; the per-device limit
        // (30 in 15 minutes) would block it, so the test server allows more.
        env: {
          PORT: String(PORT),
          HOSTNAME: "localhost",
          AUTH_RATE_LIMIT_MAX: "10000",
          // Reminders: test keys, and trust for the tests' own fake push service.
          ...testSecrets(),
          NODE_EXTRA_CA_CERTS: process.env.E2E_PUSH_CERT!,
        },
        reuseExistingServer: false,
        timeout: 60_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
