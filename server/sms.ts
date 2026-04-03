import twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return null;
  return { client: twilio(sid, token), from };
}

async function sendSMS(to: string, body: string) {
  const tw = getClient();
  if (!tw) {
    console.log("[SMS] Twilio not configured, skipping:", body);
    return;
  }

  // Normalize phone to E.164 for Canadian numbers
  let phone = to.replace(/[\s\-\(\)]/g, "");
  if (!phone.startsWith("+")) {
    phone = phone.startsWith("1") ? `+${phone}` : `+1${phone}`;
  }

  try {
    await tw.client.messages.create({
      body,
      from: tw.from,
      to: phone,
    });
    console.log(`[SMS] Sent to ${phone}`);
  } catch (err) {
    console.error("[SMS] Failed:", err);
  }
}

export async function sendOrderConfirmationSMS(
  phone: string,
  data: { orderNumber: string; pickupTime: string; totalCents: number }
) {
  const total = (data.totalCents / 100).toFixed(2);
  await sendSMS(
    phone,
    `The Stoned Chef 🍔 Order ${data.orderNumber} confirmed! Total: $${total} CAD. Pickup at ${data.pickupTime}. We'll text you when it's ready!`
  );
}

export async function sendOrderReadySMS(
  phone: string,
  data: { orderNumber: string; customerName: string }
) {
  await sendSMS(
    phone,
    `Hey ${data.customerName}! 🔥 Your order ${data.orderNumber} is READY for pickup at The Stoned Chef — 45 Dundas St, Deseronto. See you soon!`
  );
}

export async function sendNewOrderSMSToOwner(
  data: { orderNumber: string; customerName: string; totalCents: number; itemCount: number }
) {
  const ownerPhone = process.env.OWNER_PHONE;
  if (!ownerPhone) return;
  const total = (data.totalCents / 100).toFixed(2);
  await sendSMS(
    ownerPhone,
    `NEW ORDER ${data.orderNumber} — ${data.customerName} — ${data.itemCount} items — $${total}`
  );
}
