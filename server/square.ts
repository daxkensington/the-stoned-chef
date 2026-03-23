import { randomUUID } from "crypto";

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
      headers: {
        "Square-Version": "2026-01-22",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
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
