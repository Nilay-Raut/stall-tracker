// Runs after `next build`. The Docker image and the browser tests both run the
// result (.next/standalone/server.js).
//  1. Copies the static files into the standalone server, which leaves them out.
//  2. Writes the service worker (public/sw.js) with the list of this build's files.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const out = ".next/standalone";
if (!existsSync(out)) {
  console.error(`${out} not found. Is output: "standalone" set in next.config.ts?`);
  process.exit(1);
}

cpSync(".next/static", `${out}/.next/static`, { recursive: true });
if (existsSync("public")) cpSync("public", `${out}/public`, { recursive: true });

// ---- Service worker ----

/** Every file under a folder, as paths relative to it with forward slashes. */
function listFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? listFiles(full, base)
      : [path.relative(base, full).split(path.sep).join("/")];
  });
}

const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
const precache = listFiles(".next/static").map((file) => `/_next/static/${file}`);
const worker = readFileSync("src/service-worker/sw.js", "utf8")
  .replace("__BUILD_ID__", buildId)
  .replace("__PRECACHE__", JSON.stringify(precache));

if (worker.includes("__BUILD_ID__") || worker.includes("__PRECACHE__")) {
  console.error("Service worker template was not filled in completely.");
  process.exit(1);
}

mkdirSync(`${out}/public`, { recursive: true });
writeFileSync(`${out}/public/sw.js`, worker);

console.log(`Standalone server ready (${precache.length} files precached by the service worker).`);
