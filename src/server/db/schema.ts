// Database tables, added phase by phase (see docs/PLAN.md, section 4).
// Money columns hold whole paise. Every shop-owned table carries shop_id.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

// ---------- Auth ----------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** 10-digit Indian mobile number, e.g. "9876543210". */
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  recoveryPinHash: text("recovery_pin_hash").notNull(),
  createdAt,
  updatedAt,
});

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the cookie token. The token itself is never stored. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const authAttemptKind = pgEnum("auth_attempt_kind", ["login", "recovery"]);

/** Failed login / recovery tries per phone number, for lockouts. */
export const authAttempts = pgTable(
  "auth_attempts",
  {
    phone: text("phone").notNull(),
    kind: authAttemptKind("kind").notNull(),
    failedCount: integer("failed_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    updatedAt,
  },
  (t) => [primaryKey({ columns: [t.phone, t.kind] })],
);

// ---------- Shop ----------

export const language = pgEnum("language", ["en", "hi", "mr"]);
export const salesMode = pgEnum("sales_mode", ["totals", "totals_items", "bills"]);

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** One owner, one shop (v1). */
    ownerId: uuid("owner_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    language: language("language").notNull().default("en"),
    closingTime: time("closing_time").notNull().default("22:00"),
    defaultOpeningCash: integer("default_opening_cash").notNull().default(0),
    salesMode: salesMode("sales_mode").notNull().default("totals_items"),
    reminderEnabled: boolean("reminder_enabled").notNull().default(false),
    lastReminderDate: date("last_reminder_date"),
    /** Brand colour chosen in Settings, "#rrggbb" (lower case). Null = the app's green. */
    accentColor: text("accent_color"),
    createdAt,
    updatedAt,
  },
  (t) => [
    check("shops_opening_cash_non_negative", sql`${t.defaultOpeningCash} >= 0`),
    check("shops_accent_color_hex", sql`${t.accentColor} ~ '^#[0-9a-f]{6}$'`),
  ],
);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/**
 * The shop's logo (docs/PLAN-v2.md, Phase 2): a small square image made on the
 * phone, checked again on the server. Kept in its own table so shop reads stay light.
 */
export const shopLogos = pgTable(
  "shop_logos",
  {
    shopId: uuid("shop_id")
      .primaryKey()
      .references(() => shops.id, { onDelete: "cascade" }),
    /** image/webp, image/png or image/jpeg (checked against the file's own bytes). */
    mime: text("mime").notNull(),
    bytes: bytea("bytes").notNull(),
    updatedAt,
  },
  (t) => [
    check("shop_logos_mime", sql`${t.mime} in ('image/webp', 'image/png', 'image/jpeg')`),
    check("shop_logos_size", sql`octet_length(${t.bytes}) <= 102400`),
  ],
);

export const fixedCosts = pgTable(
  "fixed_costs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    monthlyAmount: integer("monthly_amount").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
  },
  (t) => [
    index("fixed_costs_shop_id_idx").on(t.shopId),
    check("fixed_costs_amount_positive", sql`${t.monthlyAmount} > 0`),
  ],
);

// ---------- Daily entries ----------

export const entryType = pgEnum("entry_type", ["sale", "expense", "cash_out"]);
export const paymentMode = pgEnum("payment_mode", ["cash", "upi"]);
export const expenseCategory = pgEnum("expense_category", [
  "raw_material",
  "gas",
  "packaging",
  "transport",
  "salary",
  "other",
]);
export const paidFrom = pgEnum("paid_from", ["drawer", "upi", "own_pocket"]);

export const entries = pgTable(
  "entries",
  {
    /** Made on the phone, so a retried sync can never create a second copy. */
    id: uuid("id").primaryKey(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    businessDate: date("business_date").notNull(),
    type: entryType("type").notNull(),
    amount: integer("amount").notNull(),
    paymentMode: paymentMode("payment_mode"),
    category: expenseCategory("category"),
    paidFrom: paidFrom("paid_from"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    /** Phone time of the last change. The latest change wins. */
    clientUpdatedAt: timestamp("client_updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("entries_shop_date_idx").on(t.shopId, t.businessDate),
    check("entries_amount_positive", sql`${t.amount} > 0`),
  ],
);

export const dayStatus = pgEnum("day_status", ["open", "closed", "off"]);

/**
 * One row per shop and day, holding that day's totals. Kept up to date by
 * recomputeDay() whenever an entry or the day's closing figures change, so
 * Calendar, Reports and Target only need simple sums.
 *
 * sales_total, cash_sales and upi_sales are the day's final figures: from the
 * closing count once the day is closed (rule 4), from the entries before that.
 */
export const days = pgTable(
  "days",
  {
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    businessDate: date("business_date").notNull(),
    status: dayStatus("status").notNull().default("open"),
    salesTotal: integer("sales_total").notNull().default(0),
    cashSales: integer("cash_sales").notNull().default(0),
    upiSales: integer("upi_sales").notNull().default(0),
    expenseTotal: integer("expense_total").notNull().default(0),
    drawerExpenses: integer("drawer_expenses").notNull().default(0),
    cashOutTotal: integer("cash_out_total").notNull().default(0),
    fixedCost: integer("fixed_cost").notNull().default(0),
    profit: integer("profit").notNull().default(0),
    entryCount: integer("entry_count").notNull().default(0),
    /** Sales as entered during the day, kept for the cash and UPI checks. */
    enteredCashSales: integer("entered_cash_sales").notNull().default(0),
    enteredUpiSales: integer("entered_upi_sales").notNull().default(0),
    // What the owner typed when closing the day (null until closed).
    openingCash: integer("opening_cash"),
    countedCash: integer("counted_cash"),
    upiTotal: integer("upi_total"),
    wasteAmount: integer("waste_amount"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    updatedAt,
  },
  (t) => [primaryKey({ columns: [t.shopId, t.businessDate] })],
);

// ---------- Items and plate counts ----------

/** Things the stall sells, with what one plate costs to make. */
export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: integer("price").notNull(),
    cost: integer("cost").notNull(),
    /** Removed items stay (inactive) so past plate counts keep their names. */
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("items_shop_idx").on(t.shopId),
    check("items_price_positive", sql`${t.price} > 0`),
    check("items_cost_non_negative", sql`${t.cost} >= 0`),
  ],
);

/**
 * Plates sold per item on a day, counted at closing. Price and cost are saved
 * as they were that day (rule 11), so a later price change does not rewrite history.
 */
export const dayItemCounts = pgTable(
  "day_item_counts",
  {
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    businessDate: date("business_date").notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    priceAtTime: integer("price_at_time").notNull(),
    costAtTime: integer("cost_at_time").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.shopId, t.businessDate, t.itemId] }),
    check("day_item_counts_quantity_positive", sql`${t.quantity} > 0`),
  ],
);

// ---------- Bills (v2 Phase 3) ----------

/**
 * The items on a sale's bill. Replaced whole whenever the sale changes. Price is
 * what the customer paid; cost is the item's cost at that time (null for custom
 * items), so later price changes do not rewrite history (as rule 11).
 */
export const saleLines = pgTable(
  "sale_lines",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    lineNo: integer("line_no").notNull(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    /** Null for a custom item typed on the bill. */
    itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** Lower-case name, so custom "Chai" and "chai " group together in reports. */
    nameKey: text("name_key").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    costAtTime: integer("cost_at_time"),
  },
  (t) => [
    primaryKey({ columns: [t.entryId, t.lineNo] }),
    index("sale_lines_shop_item_idx").on(t.shopId, t.itemId),
    index("sale_lines_shop_name_idx").on(t.shopId, t.nameKey),
    check("sale_lines_price_positive", sql`${t.unitPrice} > 0`),
    check("sale_lines_quantity_range", sql`${t.quantity} between 1 and 999`),
  ],
);

// ---------- Purchases (supplier prices) ----------

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Lower-case name, so "Oil" and "oil " are the same material. */
    nameKey: text("name_key").notNull(),
    unit: text("unit").notNull(),
    createdAt,
  },
  (t) => [uniqueIndex("materials_shop_name_idx").on(t.shopId, t.nameKey)],
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    createdAt,
  },
  (t) => [uniqueIndex("suppliers_shop_name_idx").on(t.shopId, t.nameKey)],
);

/** What an expense bought: one row per expense entry that has material details. */
export const purchases = pgTable(
  "purchases",
  {
    entryId: uuid("entry_id")
      .primaryKey()
      .references(() => entries.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    /** Quantity in thousandths (2.5 kg = 2500), so it stays a whole number. */
    quantityMilli: integer("quantity_milli").notNull(),
    unit: text("unit").notNull(),
    /** Price per unit in paise (rule 12). */
    rate: integer("rate").notNull(),
  },
  (t) => [
    index("purchases_material_idx").on(t.materialId),
    check("purchases_quantity_positive", sql`${t.quantityMilli} > 0`),
  ],
);

// ---------- Target ----------

/** Monthly profit target (wireframe screen 9). */
export const monthlyTargets = pgTable(
  "monthly_targets",
  {
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    /** "YYYY-MM" */
    month: text("month").notNull(),
    profitTarget: integer("profit_target").notNull(),
    updatedAt,
  },
  (t) => [
    primaryKey({ columns: [t.shopId, t.month] }),
    check("monthly_targets_positive", sql`${t.profitTarget} > 0`),
  ],
);

// ---------- Closing-time reminder ----------

/** A phone that asked for the closing-time reminder (Web Push). */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt,
  },
  (t) => [index("push_subscriptions_shop_idx").on(t.shopId)],
);

export type User = typeof users.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type FixedCost = typeof fixedCosts.$inferSelect;
export type EntryRow = typeof entries.$inferSelect;
export type DayRow = typeof days.$inferSelect;
export type Item = typeof items.$inferSelect;
