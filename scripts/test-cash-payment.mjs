// One-shot live test of the pay-at-pickup cash-tender flow:
// creates a $1 Square order + CASH payment (mirrors recordCashPayment),
// prints the result, then refunds the payment so books net to zero.
// Run with --keep to skip the refund (e.g. to check POS visibility first).
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

const headers = {
  "Square-Version": "2026-01-22",
  Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};
const loc = env.SQUARE_LOCATION_ID;
const keep = process.argv.includes("--keep");

// 1. Create order (PICKUP/PROPOSED, ~15 min out)
const pickupAt = new Date(Date.now() + 15 * 60_000).toISOString();
const orderRes = await fetch("https://connect.squareup.com/v2/orders", {
  method: "POST",
  headers,
  body: JSON.stringify({
    idempotency_key: randomUUID(),
    order: {
      location_id: loc,
      reference_id: "SC-CASHTEST",
      line_items: [{ name: "TEST — ignore", quantity: "1", base_price_money: { amount: 100, currency: "CAD" } }],
      fulfillments: [{
        type: "PICKUP",
        state: "PROPOSED",
        pickup_details: {
          recipient: { display_name: "Cash Test", phone_number: "6135550000" },
          pickup_at: pickupAt,
          note: "Online order #SC-CASHTEST — ** COLLECT $1.00 AT WINDOW (pre-entered as cash) **",
        },
      }],
    },
  }),
});
const orderData = await orderRes.json();
if (!orderRes.ok) {
  console.error("Order create FAILED:", JSON.stringify(orderData.errors));
  process.exit(1);
}
const orderId = orderData.order.id;
console.log("Order created:", orderId);

// 2. Record cash payment (exactly what recordCashPayment sends)
const payRes = await fetch("https://connect.squareup.com/v2/payments", {
  method: "POST",
  headers,
  body: JSON.stringify({
    idempotency_key: randomUUID(),
    source_id: "CASH",
    amount_money: { amount: 100, currency: "CAD" },
    cash_details: { buyer_supplied_money: { amount: 100, currency: "CAD" } },
    location_id: loc,
    order_id: orderId,
    reference_id: "SC-CASHTEST",
    note: "PAY AT PICKUP #SC-CASHTEST — Cash Test — collect at window",
  }),
});
const payData = await payRes.json();
if (!payRes.ok) {
  console.error("Cash payment FAILED:", JSON.stringify(payData.errors));
  process.exit(1);
}
const paymentId = payData.payment.id;
console.log("Cash payment recorded:", paymentId, "status:", payData.payment.status);

// 3. Re-fetch order to confirm paid state
const check = await (await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, { headers })).json();
console.log("Order state:", check.order.state, "| net due:", JSON.stringify(check.order.net_amount_due_money), "| tenders:", check.order.tenders?.length ?? 0);

if (keep) {
  console.log("\n--keep set: leaving test order in place. Check the POS now!");
  console.log(`Cleanup later: refund payment ${paymentId}`);
  process.exit(0);
}

// 4. Refund the cash payment to net books to zero
const refundRes = await fetch("https://connect.squareup.com/v2/refunds", {
  method: "POST",
  headers,
  body: JSON.stringify({
    idempotency_key: randomUUID(),
    payment_id: paymentId,
    amount_money: { amount: 100, currency: "CAD" },
    reason: "API test — not a real order",
  }),
});
const refundData = await refundRes.json();
if (!refundRes.ok) {
  console.error("Refund FAILED (clean up manually in Square):", JSON.stringify(refundData.errors));
  process.exit(1);
}
console.log("Refunded:", refundData.refund.id, "status:", refundData.refund.status);
