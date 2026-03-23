import { and, eq, or, gt, isNull } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  admins,
  orders,
  orderItems,
  specials,
  type Admin,
  type InsertOrder,
  type InsertOrderItem,
  type Order,
  type OrderItem,
  type Special,
  type InsertSpecial,
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
