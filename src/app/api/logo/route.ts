import { MAX_STORED_BYTES, logoProblem, sniffLogoMime } from "@/domain/logo";
import { deleteLogo, getLogo, saveLogo } from "@/server/brand";
import { getShopForApi } from "@/server/queries/shop";

/**
 * The shop's logo (docs/PLAN-v2.md, Phase 2). Only the owner can read or change it.
 *   GET    /api/logo?v=<version>  -> the image (cached for good: a new logo has a new version)
 *   PUT    /api/logo  body = image bytes  -> { version }
 *   DELETE /api/logo  -> { version: null }
 */

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Only pages of this app may change the logo (blocks cross-site requests). */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  return !!origin && !!host && new URL(origin).host === host;
}

async function ownShop() {
  const found = await getShopForApi();
  return "shop" in found ? found.shop : null;
}

export async function GET() {
  const shop = await ownShop();
  if (!shop) return json({ error: "unauthenticated" }, 401);
  const logo = await getLogo(shop.id);
  if (!logo) return json({ error: "not-found" }, 404);
  return new Response(new Uint8Array(logo.bytes), {
    headers: {
      "Content-Type": logo.mime,
      "Content-Length": String(logo.bytes.length),
      // Private: it belongs to one logged-in owner. The ?v= changes with every new logo.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const shop = await ownShop();
  if (!shop) return json({ error: "unauthenticated" }, 401);

  // Refuse early when the stated size is already too big, then check the real bytes.
  const stated = Number(request.headers.get("content-length") ?? 0);
  if (stated > MAX_STORED_BYTES) return json({ error: "too-big" }, 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  const problem = logoProblem(bytes);
  if (problem) return json({ error: problem }, problem === "too-big" ? 413 : 400);

  const version = await saveLogo(shop.id, sniffLogoMime(bytes)!, Buffer.from(bytes));
  return json({ version });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const shop = await ownShop();
  if (!shop) return json({ error: "unauthenticated" }, 401);
  await deleteLogo(shop.id);
  return json({ version: null });
}
