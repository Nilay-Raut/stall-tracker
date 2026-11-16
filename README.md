# Stall Tracker

Installable phone app (PWA) for a food stall owner: record sales and expenses, close the day, and see profit, reports and targets.

The full plan (screens, business rules, database, security, offline, AWS, phases) is in [docs/PLAN.md](docs/PLAN.md).
Deploying to AWS, step by step: [docs/DEPLOY.md](docs/DEPLOY.md).

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · PostgreSQL 17 · Drizzle ORM · Zod · Vitest

## Run locally

Needs Node.js 24 and Docker Desktop.

```bash
npm install
cp .env.example .env.local   # local settings, never committed
npm run db:up                # starts Postgres in Docker on 127.0.0.1:5432
npm run dev                  # http://localhost:3000
```

Open it in the browser's phone view (DevTools device toolbar) since the app is built for phone width.

## Scripts

| Script                | What it does                                                 |
| --------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Development server                                           |
| `npm run build`       | Production build (standalone output for Docker)              |
| `npm run check`       | Type check, lint and unit tests; run before every commit     |
| `npm test`            | Unit tests once (`npm run test:watch` to keep running)       |
| `npm run format`      | Format all files with Prettier                               |
| `npm run db:up`       | Start the local database (`db:down` to stop it)              |
| `npm run db:generate` | Create a migration from changes in `src/server/db/schema.ts` |
| `npm run db:migrate`  | Apply migrations to the database in `DATABASE_URL`           |
| `npm run db:studio`   | Browse the database in the browser                           |

Browser tests (Playwright, phone screen): `npm run build`, then `npm run test:e2e`. They need the local database running and use random phone numbers, so they can run repeatedly.

The browser tests include an accessibility check of every screen (axe-core, WCAG 2.1 AA) and a Hindi/Marathi run. A slow long-session memory check runs only on request: `MEMORY_CHECK=1 npx playwright test memory`.

## Languages

English, Hindi and Marathi, chosen per shop in Setup and remembered on the phone. The English sentence in the code is the key: `t("Sale amount")`, with values as `t("{amount} to go", { amount })`. Translations live in `src/i18n/phrases/`, one file per area. `npm test` fails if a sentence has no Hindi or Marathi translation, if a translation is unused, or if a `{value}` is missing. Keys must be plain string literals right after `t(` or `msg(` (write `cond ? t("a") : t("b")`, not `t(cond ? "a" : "b")`).

Closing-time reminders in development: add keys to `.env.local` with
`node scripts/generate-secrets.mjs CRON_SECRET VAPID_PUBLIC_KEY >> .env.local`. The service
worker (offline use, reminders) only runs in the production build (`npm run build && npm start`).

## Database changes

Edit `src/server/db/schema.ts`, run `npm run db:generate` to create a migration in `drizzle/`, review the SQL, then `npm run db:migrate`. Migrations are committed.

## Owner forgot both password and recovery PIN

Run on the server after confirming the person owns the number. It prints a temporary password (and a new PIN with `--pin`), logs out every device and clears lockouts:

```bash
node --env-file=.env.local scripts/reset-password.mjs 9876543210 --pin   # local
sudo docker compose exec app node tools/scripts/reset-password.mjs 9876543210 --pin # production, in /opt/stall
```

Health check: `GET /api/health` returns `{"status":"ok"}`, or HTTP 503 when the database is unreachable.

## Folder layout

```
src/
  app/            routes; (app)/(tabs) holds the screens with the bottom nav
  components/ui/  shared building blocks (Button, Card, ChoiceGroup, MoneyInput ...)
  components/feature/  pieces used by one screen
  domain/         pure business maths, no database or React (from phase 3)
  server/db/      Drizzle schema and client
  lib/            money (paise), dates (India time), env, small helpers
docs/PLAN.md      the plan
```

Rules: money is whole paise, dates are `YYYY-MM-DD` in India time, maths lives in `domain/`, database code lives in `server/`, and every query is scoped to the logged-in user's shop.
