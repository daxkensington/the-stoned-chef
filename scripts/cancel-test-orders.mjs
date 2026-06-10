// Cancels the SC-CASHTEST test orders: fulfillment -> CANCELED, then order state terminal.
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

const search = await (await fetch("https://connect.squareup.com/v2/orders/search", {
  method: "POST",
  headers,
  body: JSON.stringify({
    location_ids: [env.SQUARE_LOCATION_ID],
    query: { filter: { state_filter: { states: ["OPEN"] } } },
    limit: 100,
  }),
})).json();

const tests = (search.orders ?? []).filter((o) => o.reference_id === "SC-CASHTEST");
console.log(`Found ${tests.length} open SC-CASHTEST orders`);

for (const o of tests) {
  const f = (o.fulfillments ?? [])[0];
  const body = {
    order: {
      version: o.version,
      // Paid orders can't be CANCELED; cancelling the fulfillment is enough
      // to clear them from the POS, and the order auto-completes.
      ...(f ? { fulfillments: [{ uid: f.uid, state: "CANCELED" }] } : {}),
    },
    idempotency_key: crypto.randomUUID(),
  };
  const res = await fetch(`https://connect.squareup.com/v2/orders/${o.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  const d = await res.json();
  if (!res.ok) {
    console.error(`${o.id}: FAILED`, JSON.stringify(d.errors));
    continue;
  }
  console.log(`${o.id}: state=${d.order.state} fulfillment=${d.order.fulfillments?.[0]?.state}`);
}
