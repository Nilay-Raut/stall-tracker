import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";
import { sendDueReminders } from "@/server/reminders";

/**
 * Sends due closing-time reminders. Called every few minutes by a timer on the
 * server itself (deploy/stall-reminders.timer), never from outside: Caddy blocks
 * /api/cron/ from the internet, and the request must carry the shared secret.
 */
export async function POST(request: Request) {
  const secret = serverEnv().CRON_SECRET;
  const given = request.headers.get("x-cron-secret") ?? "";
  if (!secret || !safeEqual(given, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await sendDueReminders();
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
