import { validateRequest } from "twilio";

/**
 * Inbound SMS for the published number. `sms_url` was empty, so every text to
 * the number on the website vanished — including replies to the order
 * confirmation and "your order is ready" texts the same number sends out.
 *
 * Forwards a copy to FORWARD_PHONE and stays silent to the sender: an
 * auto-reply from a number a human is now watching would be worse than nothing.
 */

const PUBLIC_URL = "https://thestonedchef.ca/api/twilio/sms";

function emptyTwiml() {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const forwardTo = process.env.FORWARD_PHONE;

  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";

  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!authToken || !validateRequest(authToken, signature, PUBLIC_URL, params)) {
    // Anyone can POST here; without this an outsider could make the store send
    // texts on demand, at the store's expense.
    return new Response("forbidden", { status: 403 });
  }

  const from = params.From ?? "unknown";
  const body = params.Body ?? "";

  // Forwarding a text that came FROM the forward target would bounce it
  // straight back and keep going.
  if (!forwardTo || from === forwardTo) return emptyTwiml();

  const { default: twilio } = await import("twilio");
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const storeNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !storeNumber) return emptyTwiml();

  try {
    await twilio(sid, authToken).messages.create({
      from: storeNumber,
      to: forwardTo,
      // Sender first: the forwarded copy comes from the store's own number, so
      // without it there is no way to tell who wrote it or who to reply to.
      body: `Stoned Chef text from ${from}:\n${body}`.slice(0, 1500),
    });
  } catch (err) {
    // Never fail the webhook: Twilio would retry and the customer would get
    // nothing either way.
    console.error("[twilio/sms] forward failed:", err);
  }

  return emptyTwiml();
}
