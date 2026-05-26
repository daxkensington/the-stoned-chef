import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split(/\r?\n/)
  .find((l) => l.startsWith("DATABASE_URL="))
  .slice("DATABASE_URL=".length)
  .trim()
  .replace(/^"|"$/g, "");

const sql = neon(url);

const summary = await sql`
  SELECT
    count(*)::int AS total_orders,
    count(*) FILTER (WHERE payment_status = 'paid')::int AS paid_orders,
    coalesce(sum(total_cents), 0)::int AS gross_cents,
    coalesce(sum(total_cents) FILTER (WHERE payment_status = 'paid'), 0)::int AS paid_cents,
    min(created_at) AS first_order,
    max(created_at) AS last_order
  FROM orders`;

console.log("SUMMARY:", JSON.stringify(summary[0], null, 2));

const rows = await sql`
  SELECT order_number, customer_name, customer_phone, total_cents, tip_cents,
         status, payment_status, payment_method, pickup_time, created_at
  FROM orders
  ORDER BY created_at DESC
  LIMIT 25`;

console.log(`\nRECENT ORDERS (${rows.length}):`);
for (const r of rows) console.log(JSON.stringify(r));
