import { billsCsv, daysCsv, entriesCsv } from "@/domain/exportCsv";
import { translator } from "@/i18n/translate";
import { businessDate } from "@/lib/dates";
import { resolveRange } from "@/lib/ranges";
import { getShopForApi } from "@/server/queries/shop";
import { billLinesForExport } from "@/server/itemSales";
import { exportEntries, reportDays } from "@/server/reports";

/**
 * CSV download of a report period, for Reports > Share or download.
 * GET /api/export/days?range=month   GET /api/export/entries?range=custom&from=…&to=…
 * GET /api/export/bills?range=week (one row per item on a bill)
 * Only the logged-in owner's shop; never cached.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/export/[kind]">) {
  const { kind } = await params;
  if (kind !== "days" && kind !== "entries" && kind !== "bills") {
    return new Response(null, { status: 404 });
  }

  const auth = await getShopForApi();
  if ("error" in auth) {
    return new Response(null, { status: auth.error === "unauthenticated" ? 401 : 404 });
  }
  const { shop } = auth;

  const query = new URL(request.url).searchParams;
  const range = resolveRange(
    query.get("range"),
    businessDate(),
    query.get("from") ?? undefined,
    query.get("to") ?? undefined,
  );
  const t = translator(shop.language);
  const csv =
    kind === "days"
      ? daysCsv(await reportDays(shop.id, range.from, range.to), t)
      : kind === "bills"
        ? billsCsv(await billLinesForExport(shop.id, range.from, range.to), shop.language, t)
        : entriesCsv(await exportEntries(shop.id, range.from, range.to), shop.language, t);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stall-${kind}-${range.from}-to-${range.to}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
