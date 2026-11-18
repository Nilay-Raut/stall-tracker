import "server-only";
import { headers } from "next/headers";

/**
 * The app's public address as the visitor sees it (https://xxxx.cloudfront.net).
 * CloudFront forwards the viewer's Host and says in CloudFront-Forwarded-Proto
 * whether the visitor used HTTPS; locally it is plain http://localhost.
 */
export async function publicOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = h.get("cloudfront-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}
