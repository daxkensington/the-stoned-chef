import { validateRequest } from "twilio";

/**
 * Whisper played to whoever answers a forwarded call, before the two legs are
 * bridged. Twilio fetches this from the `url` on <Number> in the voice route,
 * and plays it to the answering party only — the caller hears ringing until it
 * finishes, so it has to stay to a couple of seconds.
 *
 * The point: a forwarded call arrives with the CUSTOMER's caller ID, which is
 * what you want on the screen, but it makes a store call indistinguishable from
 * a personal one until someone has already said "hello".
 */

const PUBLIC_URL = "https://thestonedchef.ca/api/twilio/whisper";

function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";

  // Fails OPEN, to silence rather than to an error: whatever goes wrong here,
  // the call must still connect. A missing whisper is a small annoyance; a
  // whisper that breaks the bridge loses the customer.
  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!authToken || !validateRequest(authToken, signature, PUBLIC_URL, params)) {
    return twiml("");
  }

  return twiml(`<Say voice="alice">Call for The Stoned Chef.</Say>`);
}
