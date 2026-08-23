import { validateRequest } from "twilio";

/**
 * Inbound voice for the number published on the site (+1-343-337-5810, the
 * `telephone` in the Restaurant JSON-LD).
 *
 * This replaced `http://twimlets.com/forward?...`, which was the store's entire
 * phone line: an unsupported Twilio-labs service, reached over plain HTTP, with
 * the destination sitting in a URL query string in the Twilio console. It also
 * forwarded to a former employee's personal mobile for as long as it existed —
 * the kind of thing nobody re-reads. Keeping the TwiML here means the
 * destination is one env var, and offboarding someone can't be undone by a
 * setting in another product's dashboard.
 */

// Twilio signs webhooks against the exact URL it was configured with. Deriving
// it from the request host would let a proxied or spoofed Host header change
// what we validate against, so it is pinned.
const PUBLIC_URL = "https://thestonedchef.ca/api/twilio/voice";

// Played to the answering party before the legs bridge, so a store call is
// recognisable as one — the forwarded call carries the customer's caller ID,
// which is right for the screen but says nothing about which line it came in on.
const WHISPER_URL = "https://thestonedchef.ca/api/twilio/whisper";

function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
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

  // Unsigned requests get the same closed-line message a caller would hear if
  // forwarding were off — never the TwiML, which would leak the destination.
  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!authToken || !validateRequest(authToken, signature, PUBLIC_URL, params)) {
    return twiml(
      `<Say voice="alice">Sorry, this line is not available right now.</Say><Hangup/>`
    );
  }

  if (!forwardTo) {
    // Better than silence: say where the truck is rather than dropping the call.
    return twiml(
      `<Say voice="alice">Thanks for calling The Stoned Chef. We're open daily, eleven a.m. to seven p.m., at forty-five Dundas Street in Deseronto. See you at the truck.</Say><Hangup/>`
    );
  }

  // No callerId: the forwarded call keeps the customer's own number, so the
  // phone that rings shows who is calling instead of the store's own line.
  // Anything after <Dial> runs only when the call was not answered.
  return twiml(
    `<Dial timeout="20"><Number url="${WHISPER_URL}">${forwardTo}</Number></Dial>` +
      `<Say voice="alice">Sorry we missed you. We're open daily, eleven a.m. to seven p.m., at forty-five Dundas Street in Deseronto.</Say>`
  );
}
