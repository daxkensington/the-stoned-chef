// Places ONE diagnostic order against PRODUCTION to test the Square POS push.
const BASE = "https://thestonedchef.ca";

const input = {
  customerName: "DIAGNOSTIC TEST — ignore",
  customerPhone: "6135550199",
  pickupTime: "4:00 PM",
  notes: "Automated diagnostic test order — please ignore / cancel.",
  items: [
    { id: "diag-test", name: "DIAGNOSTIC TEST", category: "test", priceCents: 100, quantity: 1 },
  ],
  tipCents: 0,
  smsOptIn: false,
};

const url = `${BASE}/api/trpc/orders.place?batch=1`;
const body = JSON.stringify({ "0": { json: input } });

console.log("POST", url);
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body,
});
console.log("HTTP", res.status);
const text = await res.text();
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  console.log("Raw response:", text.slice(0, 800));
  process.exit(1);
}
// httpBatchLink response: [{ result: { data: { json: {...} } } }] or [{ error: {...} }]
const entry = Array.isArray(parsed) ? parsed[0] : parsed;
if (entry?.error) {
  console.log("tRPC ERROR:", JSON.stringify(entry.error, null, 2));
} else {
  const data = entry?.result?.data?.json ?? entry?.result?.data;
  console.log("RESULT:", JSON.stringify(data, null, 2));
  console.log(data?.squareSynced ? "\n✅ squareSynced=true — order reached Square!" : "\n❌ squareSynced=false — Square push FAILED again");
}
