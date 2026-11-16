import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

function createDb() {
  const env = serverEnv();
  const sql = postgres(env.DATABASE_URL, {
    // One small instance serves one shop; a few connections are plenty
    // and keep memory low on the 1 GB server.
    max: 5,
    idle_timeout: 30,
  });
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
/** A database transaction, as passed to db.transaction(async (tx) => ...). */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Db };

export function getDb(): Db {
  if (!globalForDb.db) {
    globalForDb.db = createDb();
  }
  return globalForDb.db;
}
