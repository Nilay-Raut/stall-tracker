# Stall Sales Tracker — Build Plan

Source: the 12 wireframe screens ("Stall Sales Tracker Wireframes").
Goal: a simple, installable PWA (Add to Home Screen) for one stall owner to record sales and expenses, close the day, and see profit, reports and targets.

---

## 1. Decisions (short version)

| Area       | Choice                                                                                                     | Why                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js (latest stable, App Router) + TypeScript                                                           | One codebase for UI and backend. No separate API server to build or host.                                               |
| Backend    | Server Actions for writes, Server Components for reads                                                     | Least code. Route Handlers only where needed (offline sync, health check).                                              |
| Database   | PostgreSQL 16                                                                                              | Data is relational and report-heavy (sums by day, weekday, category, supplier).                                         |
| ORM        | Drizzle ORM + drizzle-kit migrations                                                                       | Light on memory (important on a 1 GB server), close to SQL, typed.                                                      |
| Validation | Zod                                                                                                        | Same schema checks form input on client and server.                                                                     |
| Styling    | Tailwind CSS with tokens taken from the wireframe                                                          | Wireframe is plain boxes and text; no component library needed.                                                         |
| Charts     | Plain CSS bars                                                                                             | The wireframe charts are simple bars. No chart library.                                                                 |
| Languages  | next-intl: English, Hindi, Marathi                                                                         | Setup screen offers these three.                                                                                        |
| Auth       | Mobile number + password, with a 6-digit recovery PIN for "forgot password"                                | No SMS or email service needed. Not in the wireframe, so Login, Register and Forgot password screens are added.         |
| Offline    | IndexedDB (through the tiny `idb` library) holding an outbox of unsynced changes and a small bounded cache | Daily entry and day close work with no network. See section 7.                                                          |
| PWA        | `app/manifest.ts` + small hand-written service worker                                                      | Follows the official Next.js PWA guide. Add Serwist only if precaching gets complicated.                                |
| Reminder   | Web Push (`web-push` library, VAPID keys) sent by a 5-minute cron on the server                            | Closing-time notification even when the app is shut. No paid service; browsers deliver push for free.                   |
| Hosting    | One EC2 instance running Docker Compose: Next.js + Postgres + Caddy                                        | Cheapest and simplest on AWS. Database is never exposed to the internet.                                                |
| HTTPS      | CloudFront in front of EC2, using its free `*.cloudfront.net` address                                      | No domain to buy. CloudFront is free at this traffic level. A domain can be added later.                                |
| Storage    | S3 for nightly database backups                                                                            | Only storage need in v1 (no image uploads in the wireframe).                                                            |
| Amplify    | Not used in v1                                                                                             | Amplify-hosted Next.js would need the database open to the internet or a paid RDS + VPC setup. One EC2 box avoids both. |
| CI/CD      | GitHub Actions: test, build Docker image, deploy to EC2                                                    | A 1 GB instance cannot build Next.js reliably; build in CI, only run on the server.                                     |
| Tests      | Vitest for money logic, a few Playwright flows                                                             | The calculations are the risky part; the UI is simple.                                                                  |

---

## 2. Screens and routes

| #   | Wireframe             | Route                  | Notes                                                                                                                            |
| --- | --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| –   | (new) Login           | `/login`               | Mobile number + password.                                                                                                        |
| –   | (new) Register        | `/register`            | Mobile number, password, 6-digit recovery PIN (entered twice).                                                                   |
| –   | (new) Forgot password | `/forgot`              | Mobile number + recovery PIN, then set a new password.                                                                           |
| 1   | Setup                 | `/setup`               | First run, later reached from Settings. Shop name, language, closing time, opening cash, sales mode, fixed costs, link to Items. |
| 2   | Today                 | `/`                    | Sales vs target, break-even, expenses, fixed costs, profit so far, action buttons, today's entries (tap to edit).                |
| 3   | Add sale              | `/add/sale?date=`      | Keypad, quick add (+100, +500, +1000), Cash or UPI, date picker.                                                                 |
| 4   | Add expense           | `/add/expense?date=`   | Amount, category, paid from, optional material details with rate comparison.                                                     |
| –   | Cash out              | `/add/cash-out?date=`  | Third tab in the Add screens. Amount only.                                                                                       |
| 5   | Day close             | `/close?date=`         | Cash in drawer, UPI total, plates sold (optional), waste (optional).                                                             |
| 6   | Day summary           | `/summary/[date]`      | Profit, breakdown, target bar, things to know, plate insight.                                                                    |
| 7   | Calendar              | `/calendar`            | Month grid, day states, selected day panel, mark shop closed.                                                                    |
| 8   | Reports               | `/reports`             | Week / Month / Custom. Profit, daily bars, insights, spend by category, weekday averages, cash vs UPI, profit by item.           |
| 9   | Target                | `/target`              | Monthly profit target, progress, required sales per day, ways to get there.                                                      |
| 10  | Supplier prices       | `/reports/prices`      | Per material: latest rate, monthly trend, supplier comparison, purchase history.                                                 |
| 11  | Items                 | `/settings/items`      | List with price, cost, margin.                                                                                                   |
| 12  | Edit item             | `/settings/items/[id]` | Price plus one of cost / margin ₹ / margin %; app works out the rest.                                                            |

Bottom nav (Today, Calendar, Reports, Target) is a shared layout for screens 2, 7, 8, 9.

---

## 3. Business rules (taken from the wireframe numbers)

These are the heart of the app. They live in pure functions in `src/domain/` and get unit tests using the wireframe's own numbers.

1. **Entry types**: sale (cash or UPI), expense (category + paid from drawer / UPI / own pocket), cash out (owner takes cash from drawer).
2. **Cash sales at close** = cash in drawer now − opening cash + expenses paid from drawer + cash taken out.
   Check: 2,275 − 1,000 + 1,375 + 500 = 3,150.
3. **Cash check** = cash sales from rule 2 − cash sales entered during the day. Check: 3,150 − 3,100 = +50.
4. **Day sales after close** = cash sales from rule 2 + UPI total entered at close. The closing figures win over the entries. Before close, sales = sum of sale entries.
5. **Fixed cost per day** = monthly fixed costs ÷ days in that month. It counts on closed-shop days too. Check: 22,500 ÷ 30 = 750; 13 days = 9,750.
6. **Profit** = sales − expenses − fixed cost per day. Check: 5,630 − 2,275 − 750 = 2,605.
7. **Break-even for the day** = expenses + fixed cost per day. Check: 2,275 + 750 = 3,025.
8. **Averages** leave out days marked "shop closed". Check: 65,860 ÷ 12 open days = 5,488.
9. **Sales needed per day** = (remaining profit ÷ remaining days + fixed cost per day) ÷ margin ratio, where margin ratio = (sales − expenses) ÷ sales for the month. Check: (50,240 ÷ 17 + 750) ÷ 0.60 ≈ 6,180. Today's sales target on the Today screen comes from the same formula.
10. **Item margin** = price − cost; margin % = margin ÷ price. Given any one of cost, margin ₹ or margin %, the other two are worked out. Warn when cost is above price.
11. **Item profit** = plates × (price − cost), using the price and cost saved with that day's count, so later price changes do not rewrite history.
12. **Material rate** = amount ÷ quantity. Compare with the last purchase of the same material (any supplier).
13. **Sales mode**: "Totals only" means no sale entries during the day, only totals at close. "Totals + item count" adds the plate counter, which can be skipped any day.
14. **Salary, two ways**: a helper paid monthly goes in Setup as a fixed cost and is spread over the days. A helper paid daily is entered as a Salary expense on that day. Both can be used together. The Salary button on Add expense carries a short hint ("Only for daily wages. Monthly salary is in Settings.") so the same pay is not entered twice.
15. **Opening cash** for a day = cash counted at the previous close. The Setup value is used for the first day or after a gap.
16. **Own-pocket expenses** count in expenses and profit but not in the drawer maths.
17. **Closing reminder**: at the shop's closing time, if today is not closed and not marked "shop closed", send one notification: "Time to close the day". Tapping it opens Day close. One reminder a day. Today also shows an in-app banner after closing time, which works even when notifications are denied.
18. **Insights** (Reports, Target, Summary) are fixed rules, not AI: best vs worst weekday, category share of sales vs last month, material price rise and its monthly cost, cheaper supplier saving, best item by profit, "ways to get there" from item margins and average plate counts.

All money is stored as whole numbers in paise. Dates are business dates in Asia/Kolkata.

---

## 4. Database

```
users            id, phone (unique), password_hash, recovery_pin_hash, created_at
sessions         id (hash of token), user_id, expires_at
auth_attempts    phone, kind (login | recovery), failed_count, locked_until
push_subscriptions  id, user_id, shop_id, endpoint (unique), p256dh, auth, created_at
                    -- shops also gets: reminder_enabled, last_reminder_date
shops            id, owner_id, name, language, closing_time, default_opening_cash,
                 sales_mode (totals | totals_items)
fixed_costs      id, shop_id, name, monthly_amount, active
monthly_targets  shop_id, month, profit_target                  unique (shop_id, month)

entries          id (uuid made on the phone), shop_id, business_date,
                 type (sale | expense | cash_out), amount,
                 payment_mode (cash | upi)                      -- sales
                 category, paid_from (drawer | upi | own_pocket) -- expenses
                 occurred_at, created_at, updated_at, deleted_at
purchases        entry_id (pk, fk), material_id, supplier_id, quantity, unit, rate
materials        id, shop_id, name, default_unit
suppliers        id, shop_id, name

days             shop_id, business_date, status (open | closed | off),
                 opening_cash, counted_cash, upi_total, waste_amount,
                 -- totals kept up to date by one function, recomputeDay():
                 cash_sales, cash_variance, sales_total, expense_total,
                 fixed_cost, profit, closed_at          unique (shop_id, business_date)
items            id, shop_id, name, price, cost, active, sort_order
day_item_counts  shop_id, business_date, item_id, quantity, price_at_time, cost_at_time
```

Notes:

- Every table has `shop_id`. Every query filters by the shop of the logged-in user. This is the main data-safety rule.
- `recomputeDay(shopId, date)` runs in the same transaction as any write to that date. Calendar, Reports and Target then read `days` with simple sums. One place for the maths, no drift.
- Entries use soft delete so an edit or delete can be traced and synced.
- Indexes: `entries (shop_id, business_date)`, `purchases (material_id)`, `days (shop_id, business_date)`.
- Expense categories are a fixed list in code (raw material, gas, packaging, transport, salary, other), not a table.

---

## 5. Code layout

```
src/
  app/
    (auth)/login/
    (app)/                 layout with auth check
      (tabs)/              layout with bottom nav: page.tsx (Today), calendar/, reports/, target/
      add/sale  add/expense  add/cash-out
      close/  summary/[date]/
      reports/prices/
      settings/  settings/items/  settings/items/[id]/
      setup/
    api/health/  api/sync/
    manifest.ts
  domain/        pure functions, no database, no React: money, dayClose, profit, target,
                 itemMargin, materialRate, insights  (+ tests beside each file)
  server/
    db/          schema.ts, client.ts, migrations/
    queries/     read functions per feature (today, calendar, reports, prices, target)
    actions/     server actions per feature; each one: check session -> Zod -> write -> recomputeDay
    auth/        session, pin hashing, rate limit
  components/
    ui/          Button, Segmented, MoneyInput, Keypad, Card, Notice, ProgressBar, BarChart, BottomNav
    feature/     pieces used by one screen
  lib/           formatting (₹, en-IN), dates (IST), env
  i18n/          en.json, hi.json, mr.json
public/          icons, sw.js
```

Clean-code rules, kept light:

- Single responsibility: maths in `domain/`, database in `server/`, display in `components/`. A page only joins them.
- Domain functions take plain data and return plain data, so they are easy to test and reuse on client (live preview on Edit item, Day close) and server.
- No repository classes, no dependency injection containers, no generic base classes. Plain functions are enough for this size.
- Server Components by default. `"use client"` only for the keypad, forms, calendar selection and the offline queue.

---

## 6. Security

- Password (minimum 8 characters) and recovery PIN are both hashed with argon2id. Neither is ever stored or logged in plain form.
- Login: 5 wrong tries per phone number, then locked for 15 minutes.
- Forgot password: 5 wrong recovery PINs, then locked for 24 hours. A 6-digit PIN is only safe with this strict limit. A successful reset logs out every device.
- Last resort if both are forgotten: an admin script run on the server sets a new password. No public screen for this.
- Login and reset answers are the same whether or not the phone number exists, so numbers cannot be probed.
- Session: random 32-byte token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie; only its hash is stored. 30-day expiry, renewed on use. Logout deletes the row.
- Auth check in the `(app)` layout and again inside every server action and query. Shop id always comes from the session, never from the request.
- Zod validation on every server action. Amount limits and date limits (no future dates).
- Server Actions already check the request origin (CSRF). `/api/sync` checks origin and session itself.
- Security headers in `next.config`: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame-ancestors none.
- Secrets only in server environment (file on the EC2 box with tight permissions, or SSM Parameter Store). Nothing secret in git or in `NEXT_PUBLIC_` variables.
- Postgres listens only on the Docker network. The security group accepts web traffic only from CloudFront (AWS managed prefix list), so the server cannot be reached directly. SSH closed; use SSM Session Manager.
- Push: the VAPID private key stays on the server. Notification text carries no money figures, since it shows on the lock screen. The cron endpoint (`/api/cron/reminders`) is called from the server itself with a secret header and is blocked from outside by Caddy. Subscriptions are deleted on logout and when the push service reports them expired.
- On the phone: no password, PIN or session token is ever kept in IndexedDB or localStorage. Local data is only the shop's own entries and totals. Logout clears IndexedDB and the caches (after warning if anything is unsynced). The service worker never caches POST requests or another user's pages.
- Nightly `pg_dump` to a private, encrypted S3 bucket, 30-day lifecycle. EC2 role can only write to that bucket. Test a restore once before going live.
- Automatic OS security updates. AWS budget alert at a small amount so the free credits cannot be overspent without notice.

---

## 7. Offline, sync and storage

**What works offline**

- Today screen, add / edit / delete sale, expense and cash out, and Day close with its summary. The maths runs on the phone using the same `domain/` functions as the server.
- Calendar, Reports and Target show the last loaded figures with an "as of" time.
- Settings, items and target changes need a connection.

**How it works**

- All local data is in IndexedDB. localStorage is not used for data: it is small and blocks the screen while it reads and writes.
- Three stores:
  - `outbox`: changes not yet on the server. Each has a uuid made on the phone and the user id.
  - `entries`: entries for today and for any day that still has unsynced changes.
  - `snapshot`: shop settings, items, and day totals for the current and previous month.
- Every write goes through one client function: save to IndexedDB, show it on screen at once, then try the server.
- Sync runs when the app opens, when the network returns, when the app comes back to the front, and after each write. It sends the outbox in order to `/api/sync` in small batches.
- The server accepts each change once (by uuid), so a retry never creates a duplicate. If the same entry was edited on two devices, the latest edit wins.
- An outbox row is deleted only after the server confirms it. A change the server rejects is kept and shown as "could not sync" with the reason; it is never dropped silently.
- If the session has expired, the outbox waits and syncs after login. Rows are tagged with the user id, so they can never be uploaded into a different account on a shared phone.

**Keeping storage and memory small**

- Cleanup runs on app start and after each sync: synced entries older than today are removed, day totals older than the previous month are removed. Expected size is well under 1 MB.
- The service worker cache holds only the app shell and static files. It is versioned; old versions are deleted when a new one activates.
- The app asks the browser for persistent storage (`navigator.storage.persist()`) so unsynced entries are not evicted, and checks free space before writing.
- If the outbox passes 200 unsynced changes, Today shows a notice to connect and sync.
- Screens load only what they show: today's entries, one month of day totals. No global store holding everything in memory, no chart library, no date library. Lists are short by design.
- Sync and cleanup are async and batched, so they never block typing on the keypad.

---

## 8. AWS setup

```
Phone (PWA) --HTTPS--> CloudFront (free https address, no caching of pages or API)
                          │ only CloudFront can reach the server
                          ▼
                       EC2 t4g.micro, ARM (Ubuntu, 2 GB swap)
                        ├─ Caddy       : reverse proxy
                        ├─ Next.js     : standalone build in Docker
                        └─ PostgreSQL  : Docker volume on the EBS disk
                                │ nightly pg_dump
                                ▼
                               S3 bucket (backups)
GitHub Actions: lint + test -> build image -> push to registry -> deploy via SSM -> run migrations
```

- HTTPS is required for install and service workers. CloudFront provides it on a free `d1234abcd.cloudfront.net` address.
- CloudFront settings: caching disabled for pages and API, all headers, cookies and query strings passed through, all HTTP methods allowed. Static files under `/_next/static` are cached.
- The link from CloudFront to EC2 is plain HTTP inside AWS. Adding a domain later lets Caddy put a certificate on the server so that link is encrypted too.
- Keep the same CloudFront distribution for the life of the app. Offline data and the installed app are tied to its address; a new distribution means users install again.
- Cost: CloudFront is free at this size. EC2, its disk and its public IP are paid from credits and cost roughly $10 to $12 a month once credits end. Keep the disk at 10 GB, one instance, no load balancer, no NAT gateway, no RDS. Budget alerts at $1 and $5.
- Environments: local (Docker Compose with Postgres) and production. No staging server in v1 to save cost; migrations are tested locally against a copy of the backup.
- Every production change (deploy, migration, config) is a deliberate step with a backup taken first.

---

## 9. Phases

Each phase ends with something usable on a phone. Later phases do not change earlier schema except by migration.

**Phase 0 — Project base**
Next.js + TypeScript + Tailwind, design tokens from the wireframe (colours, Inter and Space Grotesk, 44 px touch targets), ESLint + Prettier, Docker Compose Postgres, Drizzle with first migration, env validation, Vitest, shared UI parts (Button, Segmented, MoneyInput, Card, Notice, BottomNav).
Done when: app runs locally at phone width with the tab layout and empty pages.

**Phase 1 — Login and Setup (screen 1)**
Users, sessions, register, password login, forgot password with recovery PIN, lockouts, admin reset script, route protection. Setup form: shop name, language, closing time, opening cash, sales mode, fixed costs list with monthly and per-day total. next-intl wired with English only.
Done when: a new user can register, finish setup and land on Today; a second user cannot see the first user's data.

**Phase 2 — First deploy**
Dockerfile (standalone), Compose file for the server, Caddy, EC2, CloudFront, S3 backup job, GitHub Actions pipeline, budget alert, health check.
Carried over from Phase 1: configure CloudFront to send the `CloudFront-Viewer-Address` header to the origin (the per-IP login limit reads it); copy `scripts/` and `drizzle/` into the Docker image (admin reset script, migrations); run migrations on deploy before the new container starts.
Done when: the app opens over HTTPS on a real phone and a push to `main` deploys it. Doing this early means every later phase is tested on the real device.

**Phase 3 — Daily entry (screens 2, 3, 4 + cash out)**
Built local-first from the start so offline is not bolted on later: IndexedDB stores, the single client write function, `/api/sync`, and the sync and cleanup routines from section 7. Entries table and server-side apply (add, edit, delete). Add sale keypad with quick amounts and Cash/UPI. Add expense with category and paid-from. Cash out. Date picker for back-dated entries. Today screen with live totals, entries list and tap-to-edit. `recomputeDay` and the profit, break-even and fixed-cost functions with tests.
Done when: the Today numbers match the wireframe example when the same entries are typed in, and an entry added with the network off reaches the server exactly once after reconnecting.

**Phase 4 — Day close and summary (screens 5, 6)**
Close form: drawer cash, the working shown under it, cash-check notice, UPI total with match note, waste. Summary: profit, breakdown, things to know, same weekday last week. Edit day reopens the close form. "Totals only" mode works end to end here.
Done when: the wireframe close example gives ₹3,150 cash sales, +₹50 check and ₹2,605 profit.

**Phase 5 — Calendar (screen 7)**
Month grid with entered / off / blank states, month switch, selected-day panel, add or edit entries for that day, mark shop closed and undo.
Done when: a missed day can be filled in from the calendar and a closed day drops out of averages.

**Phase 6 — Items and plate counts (screens 11, 12 + parts of 5, 6)**
Items list with margin stats, edit item with the three input modes and loss warning, remove item. Plate counter and "Skip today" in Day close. Plate insight on Summary.
Done when: plate counts saved at close produce the per-item profit shown on the summary.

**Phase 7 — Reports and supplier prices (screens 8, 10 + material part of 4)**
Material details on Add expense with material and supplier suggestions and the rate comparison notice. Reports: range switch, profit header, daily bars, spend by category with last-month comparison, weekday averages, cash vs UPI, profit by item, rule-based insights. Supplier prices: material tabs, monthly trend, supplier comparison, history. Oil-price notice on Items.
Done when: report totals equal the sum of the day summaries for the same range.

**Phase 8 — Target (screen 9)**
Monthly profit target with change, progress vs days gone, sales needed per day, "ways to get there". Daily target and "to go" on Today and Summary now use the real target.
Done when: the wireframe month gives about ₹6,180 a day needed.

**Phase 9 — PWA install and full offline**
Manifest, icons, splash, install hint (Android prompt, iOS instructions), service worker extended to store pages too, so the installed app opens from cold with no network (the part that stores all built JS/CSS/font files was done early, in Phase 4, to fix screens failing to open offline). Pages hold shop data, so they must be cleared at logout. Day close offline. "As of" labels on Calendar, Reports and Target. Persistent-storage request, storage checks, outbox notice, logout cleanup.
Closing reminder: "Remind me at closing time" switch in Settings that asks for notification permission on tap, subscription saved to the server, 5-minute cron that sends due reminders once a day, tap opens Day close, in-app banner as fallback. On iPhone this works only after Add to Home Screen (iOS 16.4 or newer); the switch explains that.
Done when: a test shop with closing time a few minutes ahead gets exactly one notification on an installed Android phone, and none once the day is closed; and in airplane mode the installed app opens, takes entries and closes the day; everything syncs once on reconnect; storage stays under 1 MB after a month of test data.

**Phase 10 — Languages and hardening**
Hindi and Marathi text, Indian number format everywhere. Security headers, final rate-limit check, restore-from-backup drill, Lighthouse PWA and accessibility pass, Playwright flows for: setup, add entries, close day, view report. Simple error logging.
Also a memory check on a low-end Android phone: long session with many entries, no growth in memory, no slow keypad.
Done when: the checklist in section 6 is fully ticked and a restore has been tested.
Status (16 Nov 2026): built. Every screen in English, Hindi and Marathi (src/i18n; translations need a native speaker's review); Content-Security-Policy; error screens and one-line JSON error logs with a code shown to the owner; restore drill done (dump restored into a fresh Postgres 17 and over existing data, all row counts equal); axe-core WCAG 2.1 AA check of every screen in the e2e suite (no violations); long-session check (e2e/memory.spec.ts, MEMORY_CHECK=1): screen changes stay flat, 80 entries add about 2 MB. Still to do by hand: a full Lighthouse run and the keypad on a real low-end Android phone, and one restore from S3 on the real server.

**Phase 11 — Deeper reports (asked for after Phase 10)**
All from data already stored; no database change.
a. _Where every ₹100 went_: one bar splitting the period's sales into each expense category, fixed costs and profit (or the loss), with "₹38 of every ₹100 went on raw material". Shares are rounded so they add up to exactly 100.
b. _Compared with before_: sales, expenses and profit against the same number of days just before (Month compares 1–16 Nov with 1–16 Oct, so a half month is not set against a full one), with ▲▼ and %.
c. _Month by month_: a screen with the last 12 months (from when the shop started): profit bars and a row per month with sales, costs and profit.
d. _Tap a spending category_: the entries behind it for the period; Raw material also grouped by supplier and by material.
e. _Owner's take_: cash taken out compared with profit, with a note when more was taken than earned.
f. _Share the numbers_: CSV downloads (one row per day; one row per entry) shared straight to WhatsApp where the phone supports it, and a print layout so "Save as PDF" gives a clean page. CSV text cells are guarded against spreadsheet formulas.
Done when: the ₹100 split adds up to 100 and to the profit card; the comparison matches two Reports runs by hand; the CSV totals equal the screen.
Status (16 Nov 2026): built. Reports has the ₹100 split inside "Where the money goes" (rows open the spending details), "Compared with before" and "Your take"; new screens Month by month, Spending details, Share or download (CSV share/download) and a print page. Covered by unit tests and e2e/analysis.spec.ts.

**Phase 12 — UPI payments added by themselves (PhonePe)**
Personal UPI apps have no way for other apps to read payments. PhonePe offers it for merchants as _Integrated Static QR_: PhonePe calls our server within seconds of each payment to the shop's QR. It has to be switched on for the owner's merchant account by PhonePe (ask PhonePe Business support / the integration team for "Integrated Static QR with S2S callback"; they give a Merchant ID, salt key and salt index).

- Settings > UPI from PhonePe: owner pastes the Merchant ID and salt key; stored encrypted with a server key. The app shows the callback address to give PhonePe (one secret address per shop).
- Each successful payment becomes a UPI sale marked "PhonePe", once only (PhonePe's transaction ID is unique), checked with PhonePe's X-VERIFY signature and amount; failures and anything unsigned are refused. The phone gets it with the next sync, offline-safe.
- The owner can change or delete it like any entry, or mark it "not a sale" (refund, personal transfer). Typed UPI sales keep working; a hint warns when a typed UPI sale may double a PhonePe one.
- Day close fills UPI from these and the owner adjusts.
- Fallback for days the callback missed: import PhonePe's transaction report (needs a sample file from the owner to match the format).
  Done when: signed test callbacks (and repeats) create exactly one entry each, unsigned ones none; and one real payment shows up on Today within a minute.
  Status (18 Nov 2026): built, except the last check, which needs real PhonePe credentials.
  - Provider-neutral: `src/server/payments/providers/` holds one file per provider (PhonePe now) behind a small `PaymentProvider` interface (fields to fill in, signature check, signed sample). Storage, matching, Settings and the callback route are shared, so another gateway is one new file.
  - Settings > UPI payments > PhonePe, four steps: get the secret callback address; copy the ready-made request to PhonePe; paste Merchant ID, salt key, salt index; "Send a test" (a signed ₹1 sample through the same checks, adds no sale). Secrets and the address are encrypted with `PAYMENTS_KEY` (AES-256-GCM); only the token's hash is looked up; the token is masked in error logs.
  - `POST /api/payments/phonepe/<token>`: X-VERIFY = SHA256(response + salt key) + "###" + salt index, merchant id must match, success only for code PAYMENT_SUCCESS with paymentState COMPLETED; failed and cancelled are kept but add no sale; pending is acknowledged and ignored. Each transaction id is kept once, so retries change nothing.
  - Counting once with bills: a payment attaches to a typed UPI sale of the same amount within 15 minutes; otherwise it makes its own sale, which a UPI sale typed later (e.g. a bill) replaces.
  - Today refreshes every 30 s while a payment app is connected; sales show "UPI · PhonePe"; day close starts the UPI total from them.
  - Not built yet: the statement-file fallback (needs a sample PhonePe report) and polling PhonePe's status API for missed callbacks.

---

## 10. Confirmed decisions

1. **Login**: mobile number + password. Forgot password uses a 6-digit recovery PIN set at registration. No OTP, SMS or email service.
2. **Salary**: both ways are supported. Monthly salary is a fixed cost in Setup; daily wages are a Salary expense on the day.
3. **Opening cash**: carried forward from the previous close.
4. **HTTPS**: free CloudFront address in front of EC2. A domain can be added later.
5. **Cost**: kept as low as possible; credits pay for EC2. Budget alerts on from day one.
6. **Offline**: daily entry and day close work offline from IndexedDB, sync when online, storage cleaned automatically (section 7).

7. **Accounts**: one owner and one login per shop. No helper login or shop switcher in v1.
8. **Closing reminder**: push notification at closing time if the day is not closed, plus an in-app banner on Today.
