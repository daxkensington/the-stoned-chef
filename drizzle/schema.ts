import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────────

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

// ── Admins ───────────────────────────────────────────────────────────────────

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// ── Orders ───────────────────────────────────────────────────────────────────

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "failed",
  "refunded",
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 128 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }),
  pickupTime: varchar("pickup_time", { length: 64 }).notNull(),
  totalCents: integer("total_cents").notNull(),
  tipCents: integer("tip_cents").default(0).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  paymentMethod: varchar("payment_method", { length: 32 }),
  squareOrderId: varchar("square_order_id", { length: 128 }),
  squarePaymentId: varchar("square_payment_id", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("orders_created_at_idx").on(t.createdAt),
  index("orders_status_idx").on(t.status),
]);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  itemName: varchar("item_name", { length: 128 }).notNull(),
  itemCategory: varchar("item_category", { length: 64 }).notNull(),
  priceCents: integer("price_cents").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("order_items_order_id_idx").on(t.orderId),
]);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ── Specials ─────────────────────────────────────────────────────────────────

export const specials = pgTable("specials", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents"),
  badge: varchar("badge", { length: 64 }),
  active: boolean("active").default(true).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("specials_active_expires_idx").on(t.active, t.expiresAt),
]);

export type Special = typeof specials.$inferSelect;
export type InsertSpecial = typeof specials.$inferInsert;

// ── Sold Out Items ───────────────────────────────────────────────────────────

export const soldOutItems = pgTable("sold_out_items", {
  id: serial("id").primaryKey(),
  menuItemId: varchar("menu_item_id", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SoldOutItem = typeof soldOutItems.$inferSelect;

// ── Email Subscribers ────────────────────────────────────────────────────────

export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 128 }),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow().notNull(),
  unsubscribed: boolean("unsubscribed").default(false).notNull(),
});

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = typeof emailSubscribers.$inferInsert;
