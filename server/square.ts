import { randomUUID } from "crypto";

const SQUARE_API = "https://connect.squareup.com/v2";
const SQUARE_VERSION = "2026-01-22";

function squareHeaders(accessToken: string) {
  return {
    "Square-Version": SQUARE_VERSION,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

interface SquareLineItem {
  name: string;
  quantity: string;
  base_price_money: {
    amount: number;
    currency: string;
  };
}

interface SquareOrderPayload {
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  orderNumber: string;
  lineItems: SquareLineItem[];
  totalCents: number;
}

interface SquarePaymentPayload {
  sourceId: string;
  amountCents: number;
  orderId?: string | null;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  tipCents?: number;
}

export async function createSquarePayment(
  accessToken: string,
  locationId: string,
  payload: SquarePaymentPayload
): Promise<{ paymentId: string } | { error: string }> {
  const body: Record<string, unknown> = {
    idempotency_key: randomUUID(),
    source_id: payload.sourceId,
    amount_money: {
      amount: payload.amountCents,
      currency: "CAD",
    },
    location_id: locationId,
    reference_id: payload.orderNumber,
    note: `Online order #${payload.orderNumber} — ${payload.customerName}`,
  };

  if (payload.orderId) {
    body.order_id = payload.orderId;
  }

  if (payload.tipCents && payload.tipCents > 0) {
    body.tip_money = { amount: payload.tipCents, currency: "CAD" };
  }

  if (payload.customerEmail) {
    body.buyer_email_address = payload.customerEmail;
  }

  try {
    const response = await fetch(`${SQUARE_API}/payments`, {
      method: "POST",
      headers: squareHeaders(accessToken),
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      payment?: { id?: string; status?: string };
      errors?: Array<{ detail?: string }>;
    };

    if (!response.ok || !data.payment?.id) {
      const detail = data.errors?.[0]?.detail ?? "Payment failed";
      console.error("[Square] Payment error:", data.errors);
      return { error: detail };
    }

    return { paymentId: data.payment.id };
  } catch (err) {
    console.error("[Square] Payment network error:", err);
    return { error: "Network error processing payment" };
  }
}

export async function createSquareOrder(
  accessToken: string,
  locationId: string,
  payload: SquareOrderPayload
): Promise<string | null> {
  const url = "https://connect.squareup.com/v2/orders";

  const body = {
    idempotency_key: randomUUID(),
    order: {
      location_id: locationId,
      reference_id: payload.orderNumber,
      line_items: payload.lineItems,
      fulfillments: [
        {
          type: "PICKUP",
          state: "PROPOSED",
          pickup_details: {
            recipient: {
              display_name: payload.customerName,
              phone_number: payload.customerPhone,
            },
            pickup_at: buildPickupAt(payload.pickupTime),
            note: `Online order #${payload.orderNumber} — Pickup: ${payload.pickupTime}`,
          },
        },
      ],
      metadata: {
        source: "website",
        order_number: payload.orderNumber,
        customer_phone: payload.customerPhone,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: squareHeaders(accessToken),
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { order?: { id?: string }; errors?: unknown[] };

    if (!response.ok) {
      console.error("[Square] Failed to create order:", data.errors);
      return null;
    }

    return data.order?.id ?? null;
  } catch (err) {
    console.error("[Square] Network error:", err);
    return null;
  }
}

function buildPickupAt(pickupTime: string): string {
  const now = new Date();
  const [timePart, meridiem] = pickupTime.split(" ");
  const [hoursStr, minutesStr] = (timePart ?? "12:00").split(":");
  let hours = parseInt(hoursStr ?? "12", 10);
  const minutes = parseInt(minutesStr ?? "0", 10);

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const pickup = new Date(now);
  pickup.setHours(hours, minutes, 0, 0);

  if (pickup < now) {
    pickup.setDate(pickup.getDate() + 1);
  }

  return pickup.toISOString();
}
