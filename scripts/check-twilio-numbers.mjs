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

const sid = env.TWILIO_ACCOUNT_SID;
const token = env.TWILIO_AUTH_TOKEN;
const auth = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");

// 1. List all phone numbers owned on this account
const numsRes = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PageSize=50`,
  { headers: { Authorization: auth } }
);
const nums = await numsRes.json();
console.log(`Owned Twilio numbers (${nums.incoming_phone_numbers.length}):`);
for (const n of nums.incoming_phone_numbers) {
  console.log(
    JSON.stringify({
      number: n.phone_number,
      friendly: n.friendly_name,
      sms_url: n.sms_url || null,
      sms_app_sid: n.sms_application_sid || null,
      voice_url: n.voice_url || null,
      voice_app_sid: n.voice_application_sid || null,
    }, null, 2)
  );
}

// 2. Is OWNER_PHONE one of ours?
const owner = env.OWNER_PHONE;
const ownerOwned = nums.incoming_phone_numbers.find((n) => n.phone_number === owner);
console.log(`\nOWNER_PHONE ${owner} is ${ownerOwned ? "a TWILIO number on this account" : "NOT a Twilio number (external/real phone)"}`);

// 3. Any inbound messages TO the owner number sitting in Twilio?
const inboundRes = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?To=${encodeURIComponent(owner)}&PageSize=10`,
  { headers: { Authorization: auth } }
);
const inbound = await inboundRes.json();
console.log(`\nMessages sent TO ${owner}: ${inbound.messages.length} (direction shown)`);
for (const m of inbound.messages) {
  console.log(JSON.stringify({ date: m.date_sent, direction: m.direction, status: m.status, from: m.from, body: (m.body||"").slice(0,50) }));
}
