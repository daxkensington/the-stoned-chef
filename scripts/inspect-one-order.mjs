// Usage: node inspect-one-order.mjs <reference_id>
import { readFileSync } from "node:fs";

const ref = process.argv[2];
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
    query: { filter: { state_filter: { states: ["OPEN", "COMPLETED", "CANCELED"] } } },
    limit: 100,
  }),
})).json();

const matches = (search.orders ?? []).filter((o) => o.reference_id === ref);
for (const o of matches) {
  console.log(JSON.stringify({
    id: o.id,
    created_at: o.created_at,
    state: o.state,
    total: o.total_money,
    recipient: o.fulfillments?.[0]?.pickup_details?.recipient,
    note: o.fulfillments?.[0]?.pickup_details?.note,
    line_items: o.line_items?.map((li) => `${li.quantity}x ${li.name}`),
    tenders: o.tenders?.map((t) => ({ type: t.type, amount: t.amount_money })),
  }, null, 2));
}
