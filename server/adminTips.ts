import { and, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { orders } from "../drizzle/schema";
import { getDb } from "./db";
import { tipsRange, tipsCsv, TIPS_EXPORT_LIMIT, TIPS_PAGE_SIZE } from "../shared/adminTips";

type Input = { from: string; to: string; page: number };
function tipsWhere(input: Input) {
  const range = tipsRange(input);
  return and(eq(orders.paymentStatus, "paid"), ne(orders.status, "cancelled"),
    sql`${orders.tipCents} > 0`, gte(orders.createdAt, range.start), lt(orders.createdAt, range.end));
}
const rowColumns = { id: orders.id, orderNumber: orders.orderNumber, createdAt: orders.createdAt, tipCents: orders.tipCents };
function integer(value: unknown, positive = false): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < (positive ? 1 : 0)) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Recorded tips exceed supported precision. Choose a shorter range." });
  return number;
}

export async function getAdminTipsReport(input: Input, databaseOverride?: ReturnType<typeof getDb>) {
  const db = databaseOverride ?? getDb();
  const where = tipsWhere(input);
  // One statement gives summary, daily totals and order rows the same snapshot.
  const query = sql`WITH eligible AS (
    SELECT ${orders.id} AS id, ${orders.orderNumber} AS order_number, ${orders.createdAt} AS created_at, ${orders.tipCents} AS tip_cents
    FROM ${orders} WHERE ${where}
  ), summary AS (SELECT COALESCE(SUM(tip_cents), 0) AS total_tip_cents, COUNT(*) AS tipped_orders FROM eligible),
  daily AS (SELECT to_char(created_at AT TIME ZONE 'America/Toronto', 'YYYY-MM-DD') AS date, SUM(tip_cents) AS tip_cents, COUNT(*) AS orders FROM eligible GROUP BY date),
  page AS (SELECT * FROM eligible ORDER BY created_at DESC, id DESC LIMIT ${TIPS_PAGE_SIZE} OFFSET ${(input.page - 1) * TIPS_PAGE_SIZE})
  SELECT summary.total_tip_cents, summary.tipped_orders,
    COALESCE((SELECT json_agg(json_build_object('date', date, 'tipCents', tip_cents, 'orders', orders) ORDER BY date) FROM daily), '[]'::json) AS daily,
    COALESCE((SELECT json_agg(json_build_object('id', id, 'orderNumber', order_number, 'createdAt', created_at, 'tipCents', tip_cents) ORDER BY created_at DESC, id DESC) FROM page), '[]'::json) AS rows
  FROM summary`;
  const [result] = await db.select({
    totalTipCents: sql<number>`total_tip_cents`, tippedOrders: sql<number>`tipped_orders`,
    daily: sql<{ date: string; tipCents: number; orders: number }[]>`daily`,
    rows: sql<{ id: number; orderNumber: string; createdAt: string; tipCents: number }[]>`rows`,
  }).from(sql`(${query}) AS tips_report`);
  const totalTipCents = integer(result?.totalTipCents ?? 0);
  const tippedOrders = integer(result?.tippedOrders ?? 0);
  return {
    totalTipCents, tippedOrders, averageTipCents: tippedOrders ? Math.round(totalTipCents / tippedOrders) : 0,
    daily: (result?.daily ?? []).map(row => ({ ...row, tipCents: integer(row.tipCents, true), orders: integer(row.orders, true) })),
    rows: (result?.rows ?? []).map(row => ({ ...row, createdAt: new Date(row.createdAt), tipCents: integer(row.tipCents, true) })),
    page: input.page, pageCount: Math.max(1, Math.ceil(tippedOrders / TIPS_PAGE_SIZE)),
  };
}

export async function exportAdminTips(input: Input, databaseOverride?: ReturnType<typeof getDb>) {
  const db = databaseOverride ?? getDb();
  const rows = await db.select(rowColumns).from(orders).where(tipsWhere(input))
    .orderBy(desc(orders.createdAt), desc(orders.id)).limit(TIPS_EXPORT_LIMIT + 1);
  if (rows.length > TIPS_EXPORT_LIMIT) throw new TRPCError({ code: "BAD_REQUEST", message: "Export exceeds 10,000 tipped orders. Choose a shorter date range." });
  return { filename: `tips-${input.from}-${input.to}.csv`, csv: tipsCsv(rows.map(row => ({ ...row, tipCents: integer(row.tipCents, true) }))) };
}
