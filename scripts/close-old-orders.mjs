// Closes out stale OPEN orders in Square: unpaid pay-at-pickup orders are
// CANCELED; paid ones get their fulfillment COMPLETED (they were served).
// Run with --dry to preview.
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
const dry = process.argv.includes("--dry");

const search = await (await fetch("https://connect.squareup.com/v2/orders/search", {
  method: "POST",
  headers,
  body: JSON.stringify({
    location_ids: [env.SQUARE_LOCATION_ID],
    query: { filter: { state_filter: { states: ["OPEN"] } } },
    limit: 100,
  }),
})).json();

// SC-AMKXFT4T: Luis Barros's orphaned card charge (2026-06-07, double-tip
// bug) — left open pending refund decision.
const SKIP = new Set(["SC-AMKXFT4T"]);

for (const o of search.orders ?? []) {
  if (SKIP.has(o.reference_id)) {
    console.log(`${o.reference_id}: SKIPPED (pending refund decision)`);
    continue;
  }
  const paid = (o.tenders ?? []).length > 0;
  const f = (o.fulfillments ?? [])[0];
  const fState = f?.state;
  const plan = paid ? "COMPLETE fulfillment" : "CANCEL order";
  console.log(`${o.reference_id ?? o.id}  paid=${paid}  fulfillment=${fState}  -> ${plan}`);
  if (dry) continue;
  if (f && (fState === "COMPLETED" || fState === "CANCELED")) {
    console.log("  fulfillment already terminal, skipping");
    continue;
  }

  const order = paid
    ? { version: o.version, fulfillments: [{ uid: f.uid, state: "COMPLETED" }] }
    : {
        version: o.version,
        ...(f ? { fulfillments: [{ uid: f.uid, state: "CANCELED" }] } : {}),
        state: "CANCELED",
      };

  const res = await fetch(`https://connect.squareup.com/v2/orders/${o.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ order, idempotency_key: crypto.randomUUID() }),
  });
  const d = await res.json();
  if (!res.ok) {
    console.error(`  FAILED: ${JSON.stringify(d.errors)}`);
    continue;
  }
  console.log(`  -> state=${d.order.state} fulfillment=${d.order.fulfillments?.[0]?.state}`);
}
