// Applies database migrations from ./drizzle. Used on the server at deploy time,
// where drizzle-kit (a dev tool) is not installed.
//
//   Local:      node --env-file=.env.local scripts/migrate.mjs
//   Production: run by deploy/deploy.sh inside the app image (tools/scripts/migrate.mjs)

import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// ../drizzle next to this script: the repo root locally, tools/ in the image.
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(sql), { migrationsFolder });
  console.log("Migrations applied.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
