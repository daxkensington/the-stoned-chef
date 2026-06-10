import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const headers = {
  "Square-Version": "2026-01-22",
  Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

console.log("Configured SQUARE_LOCATION_ID:", env.SQUARE_LOCATION_ID);

const locRes = await fetch("https://connect.squareup.com/v2/locations", { headers });
const locs = await locRes.json();
console.log("\nAccount locations:");
for (const l of locs.locations ?? []) {
  console.log(`  ${l.id}  ${l.name}  status=${l.status}  type=${l.type}`);
}

// One unpaid + the one paid order
const ids = {
  "SC-LVZCGQYI (unpaid)": "8eRdYErVaPvhzneVSTICHwz3slNZY",
  "SC-FZDMDCHY (paid)": "WrfUKjc3ZJNlgFCqwzayiUB85AQZY",
};

for (const [label, id] of Object.entries(ids)) {
  const res = await fetch(`https://connect.squareup.com/v2/orders/${id}`, { headers });
  const d = await res.json();
  const o = d.order;
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify({
    location_id: o.location_id,
    state: o.state,
    source: o.source,
    tenders: o.tenders?.map((t) => ({ type: t.type, amount: t.amount_money, payment_id: t.payment_id })),
    net_amount_due: o.net_amount_due_money,
    fulfillments: o.fulfillments?.map((f) => ({ type: f.type, state: f.state, pickup_at: f.pickup_details?.pickup_at })),
    created_at: o.created_at,
  }, null, 2));
}
