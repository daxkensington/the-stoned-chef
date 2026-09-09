// Offline regression tests: exercise the real Square adapter with no network,
// credentials, database writes, payments, or printer activity.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../server/square.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function adapter(responses = []) {
  const requests = [];
  const sandboxModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: sandboxModule,
    exports: sandboxModule.exports,
    require(name) {
      if (name === "crypto") return { randomUUID };
      if (name === "@sentry/nextjs") {
        return { captureMessage() {}, captureException() {} };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
    console: { error() {} },
    async fetch(url, options) {
      requests.push({ url, body: JSON.parse(options.body) });
      const response = responses.shift();
      assert.ok(response, "Unexpected network request");
      if (response instanceof Error) throw response;
      return {
        ok: response.status < 400,
        status: response.status,
        async json() { return response.data; },
      };
    },
  }, { filename: "server/square.ts" });
  return { ...sandboxModule.exports, requests };
}

const orderPayload = {
  customerName: "Offline Test",
  customerPhone: "+16135550123",
  pickupTime: "1:45 PM",
  notes: "  Please pack sauce separately.  ",
  orderNumber: "SC-TEST",
  lineItems: [{
    name: "Burger (no onions)",
    quantity: "2",
    base_price_money: { amount: 1500, currency: "CAD" },
  }],
  totalCents: 3000,
  idempotencyKey: "offline-checkout-order",
};
const paymentPayload = {
  sourceId: "offline-source",
  amountCents: 3000,
  orderNumber: "SC-TEST",
  customerName: "Offline Test",
  tipCents: 300,
  idempotencyKey: "offline-checkout",
};

for (const orderId of [undefined, null, "", "   "]) {
  test(`missing order ID ${JSON.stringify(orderId)} blocks payment before fetch`, async () => {
    const square = adapter();
    const result = await square.createSquarePayment("offline", "location-test", {
      ...paymentPayload, orderId,
    });
    assert.match(result.error, /pickup order/);
    assert.equal(square.requests.length, 0);
  });
}

for (const [name, response] of [
  ["API rejection", { status: 400, data: { errors: [{ detail: "Rejected" }] } }],
  ["missing order ID", { status: 200, data: { order: {} } }],
  ["empty order ID", { status: 200, data: { order: { id: "" } } }],
  ["network failure", new Error("Offline test failure")],
]) {
  test(`${name} during order creation cannot fall through to a charge`, async () => {
    const square = adapter([response]);
    const orderId = await square.createSquareOrder("offline", "location-test", orderPayload);
    const result = await square.createSquarePayment("offline", "location-test", {
      ...paymentPayload, orderId,
    });
    assert.ok(result.error);
    assert.equal(square.requests.length, 1);
    assert.ok(square.requests[0].url.endsWith("/orders"));
  });
}

test("paid pickup retains kitchen details and links payment to the order", async () => {
  const square = adapter([
    { status: 200, data: { order: { id: "square-order-test" } } },
    { status: 200, data: { payment: { id: "payment-test", status: "COMPLETED" } } },
  ]);
  const orderId = await square.createSquareOrder("offline", "location-test", orderPayload);
  const result = await square.createSquarePayment("offline", "location-test", {
    ...paymentPayload, orderId,
  });
  assert.equal(result.paymentId, "payment-test");
  const orderRequest = square.requests[0].body;
  const order = orderRequest.order;
  const fulfillment = order.fulfillments[0];
  assert.equal(order.location_id, "location-test");
  assert.equal(order.reference_id, "SC-TEST");
  assert.deepEqual(order.line_items, orderPayload.lineItems);
  assert.equal(fulfillment.type, "PICKUP");
  assert.equal(fulfillment.state, "PROPOSED");
  assert.equal(fulfillment.pickup_details.recipient.display_name, "Offline Test");
  assert.equal(fulfillment.pickup_details.note,
    "Online order #SC-TEST — Pickup: 1:45 PM\nCustomer notes: Please pack sauce separately.");
  const pickup = new Date(fulfillment.pickup_details.pickup_at);
  assert.equal(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto", hour: "numeric", minute: "2-digit",
  }).format(pickup), "1:45 PM");
  const payment = square.requests[1].body;
  assert.equal(payment.order_id, orderId);
  assert.equal(payment.location_id, order.location_id);
  assert.equal(payment.amount_money.amount, 3000);
  assert.equal(payment.tip_money.amount, 300);
  assert.equal(orderRequest.idempotency_key, "offline-checkout-order");
  assert.equal(payment.idempotency_key, "offline-checkout");
});

test("absent or blank notes preserve a clean pickup ticket", async () => {
  const square = adapter(Array.from({ length: 2 }, () => ({
    status: 200, data: { order: { id: "square-order-test" } },
  })));
  for (const notes of [undefined, "   "]) {
    await square.createSquareOrder("offline", "location-test", { ...orderPayload, notes });
  }
  for (const request of square.requests) {
    assert.equal(request.body.order.fulfillments[0].pickup_details.note,
      "Online order #SC-TEST — Pickup: 1:45 PM");
  }
});
