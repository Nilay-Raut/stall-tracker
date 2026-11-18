import { receiveNotice } from "@/server/payments/receive";

/**
 * Payment notices from a provider (Phase 12): POST /api/payments/<provider>/<token>.
 * The token is the shop's secret callback address; the provider's signature is
 * checked before anything in the body is used. Providers retry until they get 200,
 * so a repeat of a known notice also gets 200 (and changes nothing).
 */

const MAX_BODY = 32 * 1024;

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/payments/[provider]/[token]">,
) {
  const { provider, token } = await params;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY) return reply(413, "too-big", provider);
  const body = await request.text();
  if (body.length > MAX_BODY) return reply(413, "too-big", provider);

  const result = await receiveNotice(provider, token, body, request.headers);
  return reply(result.status, result.outcome, provider);
}

/** One JSON log line per notice; never the token (it is the shop's secret address). */
function reply(status: number, outcome: string, provider: string) {
  console.log(
    JSON.stringify({
      level: status < 400 ? "info" : "warn",
      time: new Date().toISOString(),
      event: "payment-notice",
      provider,
      status,
      outcome,
    }),
  );
  return Response.json({ ok: status < 400 }, { status, headers: { "Cache-Control": "no-store" } });
}
