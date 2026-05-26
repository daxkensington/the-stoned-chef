import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const token = env.SQUARE_ACCESS_TOKEN;
const locationId = env.SQUARE_LOCATION_ID;
const headers = {
  "Square-Version": "2026-01-22",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

// 0. Whoami — confirm token validity + which merchant/locations it can see
const locRes = await fetch("https://connect.squareup.com/v2/locations", { headers });
const locData = await locRes.json();
console.log("LOCATIONS status", locRes.status);
if (locData.locations) {
  for (const l of locData.locations) console.log(`  ${l.id}  "${l.name}"  status=${l.status}  currency=${l.currency}`);
} else {
  console.log("  errors:", JSON.stringify(locData.errors));
}
console.log(`Configured SQUARE_LOCATION_ID = ${locationId}\n`);

// 1. Replicate createSquareOrder exactly
const pickup = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const body = {
  idempotency_key: randomUUID(),
  order: {
    location_id: locationId,
    reference_id: "TEST-DIAG",
    line_items: [
      { name: "Diagnostic Item", quantity: "1", base_price_money: { amount: 1000, currency: "CAD" } },
    ],
    fulfillments: [
      {
        type: "PICKUP",
        state: "PROPOSED",
        pickup_details: {
          recipient: { display_name: "Diag Test", phone_number: "6135550100" },
          pickup_at: pickup,
          note: "Diagnostic order — do not fulfill",
        },
      },
    ],
    metadata: { source: "website", order_number: "TEST-DIAG" },
  },
};

const res = await fetch("https://connect.squareup.com/v2/orders", {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});
const data = await res.json();
console.log("CREATE ORDER status", res.status);
console.log(JSON.stringify(data.errors ?? { order_id: data.order?.id, state: data.order?.state }, null, 2));
