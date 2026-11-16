# syntax=docker/dockerfile:1
# Production image: the Next.js standalone server plus small tools for
# migrations and the admin reset script. Built in CI, never on the 1 GB server.

ARG NODE_IMAGE=node:24-bookworm-slim

# ---- Dependencies (cached until package-lock.json changes) ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- Build ----
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Server-side tools (migrations, admin reset) ----
FROM ${NODE_IMAGE} AS tools
WORKDIR /tools
COPY deploy/tools/package.json deploy/tools/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY drizzle ./drizzle
COPY scripts/migrate.mjs scripts/reset-password.mjs scripts/generate-secrets.mjs ./scripts/

# ---- Runtime ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    # Keep idle connections longer than Caddy does (30s), so Caddy never sends a
    # request on a connection Node is just closing (that shows up as a 502).
    KEEP_ALIVE_TIMEOUT=65000 \
    # Keep Node's memory in check on the small server.
    NODE_OPTIONS=--max-old-space-size=320

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=tools --chown=node:node /tools ./tools

# Run as the unprivileged "node" user that the official image provides.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
