import { and, eq, or, gt, gte, lte, isNull, desc, sql, count } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  admins,
  orders,
  orderItems,
  specials,
  soldOutItems,
  emailSubscribers,
  type Admin,
  type InsertOrder,
  type InsertOrderItem,
  type Order,
  type OrderItem,
  type Special,
  type InsertSpecial,
  type InsertEmailSubscriber,
} from "../drizzle/schema";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const sql = neon(url);
  return drizzle({ client: sql });
}

// ── Admins ───────────────────────────────────────────────────────────────────

export async function getAdminByUsername(username: string): Promise<Admin | null> {
  const db = getDb();
  const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  return admin ?? null;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(
  order: InsertOrder,
  items: InsertOrderItem[]
): Promise<Order> {
  const db = getDb();
  const [created] = await db.insert(orders).values(order).returning();
  if (!created) throw new Error("Failed to create order");

  if (items.length > 0) {
    const itemsWithOrderId = items.map((item) => ({ ...item, orderId: created.id }));
    await db.insert(orderItems).values(itemsWithOrderId);
  }

  return created;
}

export async function getOrderByNumber(
  orderNumber: string
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

// ── Specials ─────────────────────────────────────────────────────────────────

export async function listActiveSpecials(): Promise<Special[]> {
  const db = getDb();
  const now = new Date();
  return db
    .select()
    .from(specials)
    .where(
      and(
        eq(specials.active, true),
        or(isNull(specials.expiresAt), gt(specials.expiresAt, now))
      )
    )
    .orderBy(specials.sortOrder, specials.createdAt);
}

export async function listAllSpecials(): Promise<Special[]> {
  const db = getDb();
  return db.select().from(specials).orderBy(specials.sortOrder, specials.createdAt);
}

export async function createSpecial(data: InsertSpecial): Promise<Special> {
  const db = getDb();
  const [created] = await db.insert(specials).values(data).returning();
  return created!;
}

export async function updateSpecial(id: number, data: Partial<InsertSpecial>): Promise<void> {
  const db = getDb();
  await db
    .update(specials)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(specials.id, id));
}

export async function deleteSpecial(id: number): Promise<void> {
  const db = getDb();
  await db.delete(specials).where(eq(specials.id, id));
}

// ── Order Status & Management ────────────────────────────────────────────────

export async function updateOrderStatus(
  orderNumber: string,
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
): Promise<Order | null> {
  const db = getDb();
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.orderNumber, orderNumber))
    .returning();
  return updated ?? null;
}

export async function listRecentOrders(limit = 50): Promise<(Order & { items: OrderItem[] })[]> {
  const db = getDb();
  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  const result: (Order & { items: OrderItem[] })[] = [];
  for (const order of recentOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    result.push({ ...order, items });
  }
  return result;
}

export async function getPendingOrderCount(): Promise<number> {
  const db = getDb();
  const [result] = await db
    .select({ value: count() })
    .from(orders)
    .where(
      or(eq(orders.status, "pending"), eq(orders.status, "preparing"))
    );
  return result?.value ?? 0;
}

export async function getDailySalesStats(daysBack = 7) {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const dailyOrders = await db
    .select()
    .from(orders)
    .where(gte(orders.createdAt, since))
    .orderBy(desc(orders.createdAt));

  const byDay: Record<string, { orders: number; revenue: number }> = {};
  for (const order of dailyOrders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { orders: 0, revenue: 0 };
    byDay[day].orders++;
    byDay[day].revenue += order.totalCents;
  }

  // Popular items
  const allItems = await db
    .select()
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(gte(orders.createdAt, since));

  const itemCounts: Record<string, number> = {};
  for (const row of allItems) {
    const name = row.order_items.itemName;
    itemCounts[name] = (itemCounts[name] || 0) + row.order_items.quantity;
  }

  const popularItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    dailyStats: Object.entries(byDay).map(([date, stats]) => ({ date, ...stats })),
    popularItems,
    totalOrders: dailyOrders.length,
    totalRevenue: dailyOrders.reduce((sum, o) => sum + o.totalCents, 0),
  };
}

// ── Sold Out ─────────────────────────────────────────────────────────────────

export async function getSoldOutItems(): Promise<string[]> {
  const db = getDb();
  const items = await db.select().from(soldOutItems);
  return items.map((i) => i.menuItemId);
}

export async function setSoldOut(menuItemId: string): Promise<void> {
  const db = getDb();
  await db
    .insert(soldOutItems)
    .values({ menuItemId })
    .onConflictDoNothing();
}

export async function removeSoldOut(menuItemId: string): Promise<void> {
  const db = getDb();
  await db.delete(soldOutItems).where(eq(soldOutItems.menuItemId, menuItemId));
}

// ── Email Subscribers ────────────────────────────────────────────────────────

export async function addEmailSubscriber(data: InsertEmailSubscriber): Promise<void> {
  const db = getDb();
  await db
    .insert(emailSubscribers)
    .values(data)
    .onConflictDoNothing();
}

export async function getSubscriberCount(): Promise<number> {
  const db = getDb();
  const [result] = await db
    .select({ value: count() })
    .from(emailSubscribers)
    .where(eq(emailSubscribers.unsubscribed, false));
  return result?.value ?? 0;
}
