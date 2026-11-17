# Stall Tracker v2 — Plan

Builds on [PLAN.md](PLAN.md). Five changes asked for by the owner:

1. Target moves into Settings.
2. Sales can be entered as a bill of items (saved items + custom items), so item sales can be tracked.
3. Modern "glass" look: floating nav with a centre **+** button, premium feel, **dark mode**.
4. Reports that help the owner understand sales and decide what to do.
5. Owner picks the accent colour; their shop name and logo show in the app bar (and the installed app).

Decisions taken (2026-11-18):

| Question         | Decision                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Bottom nav       | Today · Calendar · **(+)** · Reports · Settings. The + opens a sheet: Sale / Expense / Cash out.   |
| Dark mode        | In Phase 1. System / Light / Dark, chosen per phone (localStorage), no flash on load.              |
| Customer receipt | Simple WhatsApp share only: a `wa.me` link with the bill as text. No WhatsApp API, no other links. |
| Logo storage     | Postgres on the single server (`shop_logos`, bytea). Strict size and format limits (below).        |

---

## Phase 1 — Design system, glass UI, nav, dark mode ✅ done (2026-11-18)

Everything else builds on this.

**Tokens** (`src/app/globals.css`), semantic so screens never use raw colours:

| Token                                 | Use                                          |
| ------------------------------------- | -------------------------------------------- |
| `ink`, `muted`, `idle`                | text                                         |
| `paper`                               | text on an `ink` background (selected chips) |
| `canvas`                              | page background under the gradient           |
| `glass`, `glass-edge`                 | glass cards, nav, app bar                    |
| `field`, `edge`                       | inputs, outlined buttons and their border    |
| `surface`, `track`, `line`            | muted panels and keys, empty bars, dividers  |
| `accent`, `accent-ink`, `accent-soft` | brand colour (Phase 2 makes it per shop)     |
| `warn-bg`, `warn-ink`, `danger`       | notices and errors                           |

Each token has a dark value under `prefers-color-scheme: dark` (unless the phone chose Light) and under `[data-theme="dark"]`.

**Look**: accent-tinted gradient background (fixed layer, not `background-attachment`, which breaks on iOS); glass = translucent fill + `backdrop-blur` + hairline light edge + soft long shadow; radii 12/16/20/28; pressed buttons scale to 97%; motion off under `prefers-reduced-motion`.

**Low-end phones**: blur only on the app bar, nav, hero card and sheets (`glass`); other cards use `glass-soft` (no blur). No blur support or `prefers-reduced-transparency` → solid fills. Glass fill stays ≥ 60% opaque so text keeps 4.5:1 contrast (axe test in `e2e/a11y.spec.ts`).

**Components** (`src/components/ui/`):

- `AppBar` — sticky glass bar on tab screens: logo (initial on accent until Phase 2), shop name (from the phone's snapshot, so it works offline), theme toggle.
- `BottomNav` — floating glass pill with icons + labels, raised centre **+** button.
- `AddSheet` — native `<dialog>` bottom sheet opened by **+**: Sale, Expense, Cash out (links to the existing add screens, which are prefetched for offline).
- `ThemeSwitch` / theme script — System / Light / Dark, saved per phone, applied before first paint.
- Restyled: `Card` (glass tones), `Button`, `ChoiceGroup`, `TextField`, `MoneyInput`, `PasswordField`, `ProgressBar`, `Notice`, `ScreenHeader`, `Keypad`.
- Icons: `lucide-react` (tree-shaken).

**Nav**: Target leaves the bar. Until Phase 2 it is linked from Settings; the Settings tab is active on `/setup`, `/settings/*` and `/target`.

## Phase 2 — Settings hub, Target in Settings, branding ✅ done (2026-11-18)

- `/settings` hub (grouped glass list): Shop details · Appearance · Items · Monthly target · Reminders · Install app · Log out. `/setup` stays for first run and "Shop details".
- `/target` → `/settings/target` (permanent redirect; notifications and bookmarks still work). Today keeps showing the day's sales target.
- **Accent colour**: 8 preset swatches + custom picker. A colour is refused unless it has ≥ 4.5:1 contrast against the light page background (`src/domain/brand.ts`); white text on it is then always readable, so `accent-ink` stays white. Stored in `shops.accent_color` (`#rrggbb`, DB check). Copied to the phone (localStorage, via the Today snapshot or straight from Settings) and applied by the inline head script before first paint, so there is no green flash, online or offline. Cleared at logout.
- **Logo**:
  - Accepted input: PNG, JPEG or WebP only (no SVG: script risk), at most **2 MB**, at least **64×64 px**.
  - The phone crops to a square and resizes to **256×256 WebP** before upload.
  - Server re-checks: real image signature (magic bytes), WebP/PNG/JPEG only, **≤ 100 KB** stored, owner's shop only.
  - Table `shop_logos (shop_id pk, mime, bytes, updated_at)`. Served by `/api/logo?v=<updatedAt>` with `Cache-Control: immutable`; the service worker keeps a copy for offline. Remove-logo falls back to the initial.
- **Installed app icon/name per shop: deferred.** Browsers fetch the manifest without cookies, so a per-shop manifest would need a public per-shop URL; and the icon renderer cannot read WebP logos. The app bar, Settings and Appearance show the logo; the installed icon stays the app's own for now.
- Migration `0008_branding`: `shops.accent_color`, `shop_logos`. Back up the DB first.

## Phase 3 — Bills with items, WhatsApp receipt ✅ done (2026-11-18)

**Data**

```
sale_lines  entry_id (fk → entries, cascade), line_no, shop_id,
            item_id (null = custom item), name, name_key (lower-case),
            unit_price, quantity, cost_at_time (null for custom)
            pk (entry_id, line_no); index (shop_id, item_id), (shop_id, name_key)
```

- `Entry.lines: SaleLine[] | null`, synced inside the entry like `purchase`. `entrySchema` defaults it to `null`, so older phones keep syncing.
- Rules: only sales have lines; ≤ 50 lines; quantity 1–999; **amount = Σ price × qty** (checked on phone and server).
- Price and cost copied onto each line (same idea as rule 11).
- New sales mode **"Bill each sale"** (`bills`): Bill tab opens first on Add sale.
- Snapshot gains `saleItems` (id, name, price, cost, sort) so billing works offline.

**Screens**

- Add sale: tabs **Bill** | **Quick amount** (current keypad).
  - Item tiles (tap +1, qty badge; long-press to type qty), search, recent/frequent first.
  - **+ Custom item** sheet: name, price, qty. ("Save to my items" deferred: an item also needs a cost, and creating it offline needs its own sync path. Items are added in Settings › Items.)
  - Glass cart bar (count, total) → cart sheet with − qty + and remove. Cash / UPI. Save bill.
- Today entry list shows "Vada pav ×2, Chai ×1" under a billed sale; tap to edit the bill.
- **Share on WhatsApp**: after saving (and from the bill), a button opens
  `https://wa.me/?text=<bill>` (or `wa.me/91<number>?text=` if the owner types the customer's number).
  Text: shop name, date and time, lines, total, paid by. Nothing else is sent anywhere.
- Day close: on the first close of a day, plate counts are pre-filled from the day's bills (with a note), and stay editable for plates sold without a bill. The step is not skipped, so those can still be added.
- **New rule 19**: item reports use bill lines; plate counts only for days with no bills (no double counting).
- CSV export of bills: moved to Phase 4 (with the item reports).
- Migration `0009_sale_lines` (+ `bills` sales mode). Back up the DB first.

## Phase 4 — Reports v2 ✅ done (2026-11-18)

Built as planned, with these notes:

- **Today** period compares with the same weekday last week (stall days differ by weekday).
- **What to do** always looks at the last 4 weeks, whatever period is on screen, so suggestions rest on enough data. Rules live in `src/domain/salesInsights.ts` (unit-tested); each needs a minimum of data or stays silent.
- **Rule 19** (new): item figures come from bill lines; plate counts only for days with no bills.
- **Profit vs sales share** uses one hue (filled bar = profit share, tick = sales share, both written out): the shop's accent is user-chosen, so a fixed second series colour could not be guaranteed to stay distinguishable.
- **Bills CSV** (`/api/export/bills`): one row per item on a bill.
- Averages and money estimates are rounded (average bill to ₹1, monthly gain to ₹10).

Period switch Today / Week / Month / Custom, everything compared with the previous period.

| Section                    | What                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| KPI tiles                  | Sales, Profit, Bills, Average bill, Items per bill — each with ▲▼ % vs before  |
| **What to do**             | 3–5 action cards from fixed rules (rule 18: no AI)                             |
| Top items                  | By quantity / revenue / profit, sparkline each                                 |
| Slow movers                | Not sold in 7+ days, or down > 30%                                             |
| Peak hours                 | Hour × weekday heatmap from sale times ("Busiest: Sat 7–9 pm")                 |
| Margin mix                 | Share of profit vs share of sales per item; flags high-volume low-margin items |
| Bought together            | Top item pairs on the same bill                                                |
| Cash vs UPI, expense ratio | Existing, restyled                                                             |
| Item page                  | `/reports/items/[key]`: daily qty, weekday split, price history, profit        |

Action rules (pure functions in `src/domain/insights/`, unit-tested), e.g. weekday demand ("make ~25 extra on Saturday"), price nudge with monthly gain, slowest weekday offer, item not sold in N days, falling average bill.
Charts stay plain SVG/CSS, built to work on glass in both themes.

## Phase 5 — Hardening and rollout ✅ hardening done (2026-11-18); release pending

Done:

- All new text in en / hi / mr (the translations test passes). **Still needs a native speaker's read** before release.
- Unit tests: bills, entry schema with lines, brand contrast, logo checks, Today range, item and bill insights (130 in all).
- E2E: `branding.spec`, `bills.spec` (incl. offline billing, WhatsApp link, a bill pointing at another shop's item is stored as custom), `insights.spec`; axe in light and dark on the bill screen, Appearance and the new report sections. Full suite: 60 pass.
- **Upgrade path**: a copy of a database at migration 0007 with data (1,238 shops, 1,673 entries) upgraded with the server's own `migrate.mjs` to 0009; all data kept.
- **Rollback safety**: 0008/0009 only add a column, two tables and an enum value; the previous app version runs on the new schema (deploy.sh rolls back the app but keeps migrations). A shop set to "Bill each sale" would see "Totals only" behaviour on the old version.
- **Old phones**: entries without `lines` still validate (unit test); new phones' lines are ignored by an old server.
- **Memory soak** (`MEMORY_CHECK=1`): passes. It first failed: an inline SVG icon per entry row cost ~20 DOM nodes per entry (mostly Chrome-internal). Row icons are now CSS masks (`entryIcons.ts`): ~24 nodes per entry, against ~19 before v2.

Release (not done; the owner chose to commit only for now):

- Push / PR to `main` → CI tests → deploy. `deploy.sh` backs up the database before migrating on every deploy.
- After deploy: open the app on a phone that had the old version, add a sale, check it syncs.

| #   | Phase                          | Size | Needs |
| --- | ------------------------------ | ---- | ----- |
| 1   | Design system, nav, dark mode  | M    | —     |
| 2   | Settings hub, Target, branding | M    | 1     |
| 3   | Bills + WhatsApp receipt       | L    | 1     |
| 4   | Reports v2                     | L    | 3     |
| 5   | Tests and rollout              | S–M  | all   |
