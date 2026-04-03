const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "The Stoned Chef <noreply@thestonedchef.ca>";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@thestonedchef.ca";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email");
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
  } catch (err) {
    console.error("[Email] Failed to send:", err);
  }
}

export async function sendOrderNotificationToOwner(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  totalCents: number;
  items: { name: string; quantity: number; priceCents: number }[];
  notes?: string | null;
}) {
  const itemsHtml = order.items
    .map((i) => `<li>${i.quantity}x ${i.name} — $${((i.priceCents * i.quantity) / 100).toFixed(2)}</li>`)
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;background:#1a1a1a;color:#f5f5f5;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#c44d18,#d4731a);padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">New Order #${order.orderNumber}</h1>
      </div>
      <div style="padding:20px;">
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.customerPhone}</p>
        <p><strong>Pickup:</strong> ${order.pickupTime}</p>
        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}
        <h3>Items</h3>
        <ul>${itemsHtml}</ul>
        <p style="font-size:20px;font-weight:bold;color:#d4731a;">Total: $${(order.totalCents / 100).toFixed(2)} CAD</p>
      </div>
    </div>
  `;

  await sendEmail(OWNER_EMAIL, `New Order #${order.orderNumber} — $${(order.totalCents / 100).toFixed(2)}`, html);
}

export async function sendOrderConfirmationToCustomer(
  email: string,
  order: {
    orderNumber: string;
    customerName: string;
    pickupTime: string;
    totalCents: number;
    items: { name: string; quantity: number; priceCents: number }[];
  }
) {
  const itemsHtml = order.items
    .map((i) => `<li>${i.quantity}x ${i.name} — $${((i.priceCents * i.quantity) / 100).toFixed(2)}</li>`)
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;background:#1a1a1a;color:#f5f5f5;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#c44d18,#d4731a);padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Order Confirmed!</h1>
        <p style="margin:4px 0 0;opacity:0.9;">#${order.orderNumber}</p>
      </div>
      <div style="padding:20px;">
        <p>Hey ${order.customerName}! Your order is in. We're getting it ready for you.</p>
        <p><strong>Pickup Time:</strong> ${order.pickupTime}</p>
        <p><strong>Location:</strong> 45 Dundas St, Deseronto, ON</p>
        <h3>Your Order</h3>
        <ul>${itemsHtml}</ul>
        <p style="font-size:20px;font-weight:bold;color:#d4731a;">Total: $${(order.totalCents / 100).toFixed(2)} CAD</p>
        <p style="color:#999;font-size:13px;">Payment at pickup · Questions? Call (613) 328-4766</p>
      </div>
    </div>
  `;

  await sendEmail(email, `Order Confirmed #${order.orderNumber} — The Stoned Chef`, html);
}

export async function sendOrderReadyNotification(
  email: string,
  order: { orderNumber: string; customerName: string }
) {
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;background:#1a1a1a;color:#f5f5f5;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Your Order is Ready!</h1>
        <p style="margin:4px 0 0;opacity:0.9;">#${order.orderNumber}</p>
      </div>
      <div style="padding:20px;text-align:center;">
        <p style="font-size:18px;">Hey ${order.customerName}! Your food is ready for pickup.</p>
        <p><strong>45 Dundas St, Deseronto, ON</strong></p>
        <p style="color:#999;font-size:13px;">See you at the truck!</p>
      </div>
    </div>
  `;

  await sendEmail(email, `Your Order #${order.orderNumber} is Ready! — The Stoned Chef`, html);
}
