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
const from = env.TWILIO_PHONE_NUMBER;
const owner = env.OWNER_PHONE;
console.log(`Twilio number: ${from} | Owner: ${owner}`);

const auth = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?PageSize=50`;
const res = await fetch(url, { headers: { Authorization: auth } });
if (!res.ok) {
  console.error("Twilio API error", res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
console.log(`\nTotal messages in log: ${data.messages.length}`);
for (const m of data.messages) {
  console.log(
    JSON.stringify({
      date: m.date_sent,
      to: m.to,
      from: m.from,
      status: m.status,
      error: m.error_code,
      body: (m.body || "").slice(0, 70),
    })
  );
}
