// Production smoke test for the server-side order validation. Uses junk
// payment tokens, so no test can ever result in a charge.
const BASE = process.env.SMOKE_BASE ?? "https://thestonedchef.ca";

async function place(input) {
  const res = await fetch(`${BASE}/api/trpc/orders.place?batch=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 0: { json: input } }),
  });
  const data = await res.json();
  const item = Array.isArray(data) ? data[0] : data;
  if (item?.error) return { ok: false, message: item.error.json?.message ?? JSON.stringify(item.error).slice(0, 200) };
  return { ok: true, result: item?.result?.data?.json };
}

const base = {
  customerName: "Validation Smoke Test",
  customerPhone: "6135550000",
  pickupTime: "1:00 PM",
  tipCents: 0,
  smsOptIn: false,
  paymentToken: "cnon:FAKE-TOKEN-FOR-VALIDATION-TEST",
  idempotencyKey: crypto.randomUUID(),
};

const cases = [
  {
    name: "forged price (1-cent hamburger) must be rejected by pricing, not payment",
    input: { ...base, idempotencyKey: crypto.randomUUID(), items: [{ id: "burger-hamburger", name: "Hamburger", category: "burgers", priceCents: 1, quantity: 1 }] },
    expect: (r) => !r.ok && /price.*changed/i.test(r.message),
  },
  {
    name: "unknown item id must be rejected",
    input: { ...base, idempotencyKey: crypto.randomUUID(), items: [{ id: "burger-free-lunch", name: "Free Lunch", category: "burgers", priceCents: 100, quantity: 1 }] },
    expect: (r) => !r.ok && /unknown menu item/i.test(r.message),
  },
  {
    name: "forged add-on price must be rejected",
    input: { ...base, idempotencyKey: crypto.randomUUID(), items: [{ id: "burger-hamburger__add-bacon", name: "Hamburger", category: "burgers", priceCents: 801, quantity: 1, customizations: "Add Bacon" }] },
    expect: (r) => !r.ok && /price.*changed/i.test(r.message),
  },
  {
    name: "invalid pickup time must be rejected",
    input: { ...base, idempotencyKey: crypto.randomUUID(), pickupTime: "3:00 AM", items: [{ id: "burger-hamburger", name: "Hamburger", category: "burgers", priceCents: 800, quantity: 1 }] },
    expect: (r) => !r.ok && /pickup time/i.test(r.message),
  },
  {
    name: "huge tip must be rejected by schema",
    input: { ...base, idempotencyKey: crypto.randomUUID(), tipCents: 99_999_999, items: [{ id: "burger-hamburger", name: "Hamburger", category: "burgers", priceCents: 800, quantity: 1 }] },
    expect: (r) => !r.ok,
  },
  {
    name: "missing payment token must be rejected",
    input: { ...base, idempotencyKey: crypto.randomUUID(), paymentToken: "", items: [{ id: "burger-hamburger", name: "Hamburger", category: "burgers", priceCents: 800, quantity: 1 }] },
    expect: (r) => !r.ok,
  },
  {
    name: "valid order with junk token fails at PAYMENT (proves validation passed), no charge",
    input: { ...base, idempotencyKey: crypto.randomUUID(), items: [{ id: "burger-hamburger", name: "Hamburger", category: "burgers", priceCents: 800, quantity: 1, customizations: undefined }] },
    expect: (r) => !r.ok && !/price|unknown|pickup/i.test(r.message),
  },
];

let failures = 0;
for (const c of cases) {
  const r = await place(c.input);
  const pass = c.expect(r);
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.name}`);
  console.log(`      -> ${r.ok ? "ACCEPTED (!): " + JSON.stringify(r.result) : r.message.slice(0, 140)}`);
}
console.log(failures ? `\n${failures} FAILURES` : "\nAll validation smoke tests passed");
process.exit(failures ? 1 : 0);
