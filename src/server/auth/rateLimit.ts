import "server-only";
import { headers } from "next/headers";

/**
 * Simple per-IP limit for the login, register and reset forms, on top of the
 * per-phone lockouts. Kept in memory: the app runs as one process on one server,
 * so there is nothing to share. The map is capped so it cannot grow without end.
 */
const WINDOW_MS = 15 * 60 * 1000;
/** Default 30 per 15 minutes. Only the browser-test server raises it (AUTH_RATE_LIMIT_MAX). */
const MAX_REQUESTS = Number(process.env.AUTH_RATE_LIMIT_MAX) || 30;
const MAX_KEYS = 5000;

const hits = new Map<string, { count: number; resetAt: number }>();

function prune(now: number) {
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
  // Still full (an attack from many IPs): drop the oldest entries.
  for (const key of hits.keys()) {
    if (hits.size < MAX_KEYS) break;
    hits.delete(key);
  }
}

/** Returns false once this IP has used up its requests for the window. */
export async function allowRequest(action: string): Promise<boolean> {
  const key = `${action}:${await clientIp()}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    if (hits.size >= MAX_KEYS) prune(now);
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_REQUESTS;
}

/**
 * The visitor's IP. In production CloudFront sends it in CloudFront-Viewer-Address
 * ("ip:port"), set up in Phase 2. X-Forwarded-For is not used: its first value
 * is typed by the client and can be faked.
 */
async function clientIp(): Promise<string> {
  const viewer = (await headers()).get("cloudfront-viewer-address");
  return viewer ? viewer.slice(0, viewer.lastIndexOf(":")) : "local";
}
