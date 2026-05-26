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
const to = env.OWNER_PHONE;
const auth = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");

const body = new URLSearchParams({
  From: from,
  To: to,
  Body: "The Stoned Chef ✅ Test alert — order notifications are now wired to this phone. (You can ignore this.)",
});

const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
  method: "POST",
  headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
  body,
});
const data = await res.json();
if (!res.ok) {
  console.error("FAILED", res.status, JSON.stringify(data));
  process.exit(1);
}
console.log(`Sent ${from} -> ${to} | sid=${data.sid} status=${data.status} error=${data.error_code ?? "none"}`);
