import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split(/\r?\n/)
  .find((l) => l.startsWith("DATABASE_URL="))
  .slice("DATABASE_URL=".length)
  .trim()
  .replace(/^"|"$/g, "");

const sql = neon(url);

const rows = await sql`
  SELECT order_number, created_at, payment_status, payment_method,
         square_order_id IS NOT NULL AS square_synced
  FROM orders
  ORDER BY created_at DESC
  LIMIT 15`;

for (const r of rows) console.log(JSON.stringify(r));
