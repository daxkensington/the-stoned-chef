// Usage: node refund-payment.mjs <payment_id> <amount_cents> [reason]
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const [paymentId, amountStr, reason = "API test cleanup"] = process.argv.slice(2);
if (!paymentId || !amountStr) {
  console.error("Usage: node refund-payment.mjs <payment_id> <amount_cents> [reason]");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const res = await fetch("https://connect.squareup.com/v2/refunds", {
  method: "POST",
  headers: {
    "Square-Version": "2026-01-22",
    Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    idempotency_key: randomUUID(),
    payment_id: paymentId,
    amount_money: { amount: parseInt(amountStr, 10), currency: "CAD" },
    reason,
  }),
});
const data = await res.json();
if (!res.ok) {
  console.error("Refund FAILED:", JSON.stringify(data.errors));
  process.exit(1);
}
console.log("Refunded:", data.refund.id, "status:", data.refund.status);
