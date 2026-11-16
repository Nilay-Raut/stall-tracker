import path from "node:path";
import type { NextConfig } from "next";

// This project folder. Pinned because parent folders contain other lockfiles,
// which would make Next pick the wrong root and break the standalone output.
const projectRoot = path.resolve(__dirname);

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy: the browser may load scripts, styles, images and data only from
 * this app, never from another site, and the app cannot be framed. Inline scripts stay
 * allowed because Next.js puts page data in small inline scripts, and nonces would make
 * every screen server-rendered per request (no static shells, no offline screens).
 * React escapes all text, and the app has no dangerouslySetInnerHTML, eval or external scripts.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`, // dev needs eval
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isProd ? "" : " ws:"}`, // dev reload socket
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Small self-contained server bundle for the Docker image on EC2.
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Navigations made while offline wait and retry instead of failing (see docs/PLAN.md section 7).
    useOffline: true,
  },
  turbopack: {
    root: projectRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The service worker must never be cached, or phones keep an old version.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
