import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/server/db/client";

// Used by the deploy script and uptime checks. Reports only up or down,
// never error details, so nothing about the server leaks out.
export async function GET() {
  await connection(); // always run at request time, never prerendered

  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health check: database unreachable", error);
    return Response.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
