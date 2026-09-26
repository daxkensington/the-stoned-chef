import * as Sentry from "@sentry/nextjs";
import twilio from "twilio";
import { digitsOnly, last10Digits } from "./_core/fraudCore";

export type SMSResult = { sent: boolean; reason?: string };

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return null;
  return { client: twilio(sid, token), from };
}

function logSMS(
  level: "log" | "error",
  message: string,
  orderNumber: string,
  last4: string
): void {
  try {
    console[level](`[SMS] ${message} order ${orderNumber} (…${last4})`);
  } catch {
    // Logging must not throw or change the delivery result.
  }
}

async function sendSMS(to: string, body: string, orderNumber: string): Promise<SMSResult> {
  let last4 = "";
  try {
    const digits = digitsOnly(to);
    last4 = digits.slice(-4);
    const ten = last10Digits(to);
    if (ten === null) {
      logSMS("log", "Skipped (invalid phone)", orderNumber, last4);
      return { sent: false, reason: "invalid phone" };
    }

    const tw = getClient();
    if (!tw) {
      logSMS("log", "Skipped (Twilio not configured)", orderNumber, last4);
      return { sent: false, reason: "twilio not configured" };
    }

    // Normalize phone to E.164 for Canadian numbers.
    const phone = `+1${ten}`;
    await tw.client.messages.create({
      body,
      from: tw.from,
      to: phone,
    });
    logSMS("log", "Sent", orderNumber, last4);
    return { sent: true };
  } catch {
    try {
      // Raw Twilio exceptions can contain phone numbers or message text.
      Sentry.captureException(new Error("Twilio SMS send failed"), {
        tags: { area: "sms" },
        extra: { orderNumber },
      });
    } catch {
      // Reporting failures must not escape to callers.
    }
    logSMS("error", "Failed", orderNumber, last4);
    return { sent: false, reason: "twilio error" };
  }
}

export async function sendOrderConfirmationSMS(
  phone: string,
  data: { orderNumber: string; pickupTime: string; totalCents: number }
): Promise<SMSResult> {
  try {
    const total = (data.totalCents / 100).toFixed(2);
    return await sendSMS(
      phone,
      `The Stoned Chef 🍔 Order ${data.orderNumber} confirmed! Total: $${total} CAD. Pickup at ${data.pickupTime}. We'll text you when it's ready!`,
      data.orderNumber
    );
  } catch {
    return { sent: false, reason: "sms error" };
  }
}

export async function sendOrderReadySMS(
  phone: string,
  data: { orderNumber: string; customerName: string }
): Promise<SMSResult> {
  try {
    return await sendSMS(
      phone,
      `Hey ${data.customerName}! 🔥 Your order ${data.orderNumber} is READY for pickup at The Stoned Chef — 45 Dundas St, Deseronto. See you soon!`,
      data.orderNumber
    );
  } catch {
    return { sent: false, reason: "sms error" };
  }
}

export async function sendNewOrderSMSToOwner(
  data: { orderNumber: string; customerName: string; totalCents: number; itemCount: number }
): Promise<SMSResult> {
  try {
    const ownerPhone = process.env.OWNER_PHONE;
    if (!ownerPhone) return { sent: false, reason: "owner phone not configured" };
    const total = (data.totalCents / 100).toFixed(2);
    return await sendSMS(
      ownerPhone,
      `NEW ORDER ${data.orderNumber} — ${data.customerName} — ${data.itemCount} items — $${total}`,
      data.orderNumber
    );
  } catch {
    return { sent: false, reason: "sms error" };
  }
}
