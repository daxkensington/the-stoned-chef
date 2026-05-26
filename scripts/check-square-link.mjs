import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const sql = neon(env.DATABASE_URL);
const rows = await sql`
  SELECT order_number, payment_status, square_order_id, square_payment_id
  FROM orders ORDER BY created_at DESC`;

console.log("DB linkage:");
for (const r of rows) console.log(JSON.stringify(r));

// Pull each order from Square to see its real state/fulfillment
const token = env.SQUARE_ACCESS_TOKEN;
const headers = {
  "Square-Version": "2026-01-22",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

console.log("\nSquare order states:");
for (const r of rows) {
  if (!r.square_order_id) {
    console.log(`${r.order_number}: NO square_order_id (never pushed to Square)`);
    continue;
  }
  const res = await fetch(`https://connect.squareup.com/v2/orders/${r.square_order_id}`, { headers });
  const d = await res.json();
  if (!res.ok) {
    console.log(`${r.order_number}: Square fetch error ${res.status} ${JSON.stringify(d.errors)}`);
    continue;
  }
  const o = d.order;
  const f = (o.fulfillments || [])[0] || {};
  console.log(
    `${r.order_number}: state=${o.state} fulfillment=${f.type}/${f.state} total=$${(o.total_money?.amount ?? 0) / 100} source=${o.source?.name ?? "?"}`
  );
}
