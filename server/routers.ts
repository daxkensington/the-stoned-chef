import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import {
  createOrder,
  getOrderByNumber,
  listActiveSpecials,
  listAllSpecials,
  createSpecial,
  updateSpecial,
  deleteSpecial,
  getAdminByUsername,
  updateOrderStatus,
  listRecentOrders,
  getPendingOrderCount,
  getDailySalesStats,
  getSoldOutItems,
  setSoldOut,
  removeSoldOut,
  addEmailSubscriber,
  getSubscriberCount,
} from "./db";
import { createSquareOrder, createSquarePayment } from "./square";
import { sendOrderConfirmationSMS, sendOrderReadySMS, sendNewOrderSMSToOwner } from "./sms";
import {
  sendOrderNotificationToOwner,
  sendOrderConfirmationToCustomer,
  sendOrderReadyNotification,
} from "./email";
import { createHash } from "crypto";
import { verifyPassword, signJWT, getSessionCookie } from "./_core/auth";
import { COOKIE_NAME } from "@shared/const";
import { VALID_PICKUP_TIMES } from "@shared/pickup";
import { validateCartPricing } from "./pricing";

const cartItemSchema = z.object({
  id: z.string().max(256),
  name: z.string().max(128),
  category: z.string().max(64),
  priceCents: z.number().int().positive(),
  quantity: z.number().int().positive().max(50),
  customizations: z.string().max(500).optional(),
});

// Deterministic order number from the client's idempotency key: a retried
// submission maps to the same order_number (unique in the DB), so it can be
// recognized instead of double-processed.
const ORDER_NUMBER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function orderNumberFromKey(key: string): string {
  const hash = createHash("sha256").update(key).digest();
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += ORDER_NUMBER_ALPHABET[hash[i]! % ORDER_NUMBER_ALPHABET.length];
  }
  return `SC-${s}`;
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.admin) return null;
      return { id: ctx.admin.id, username: ctx.admin.username };
    }),

    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const admin = await getAdminByUsername(input.username);
        if (!admin || !verifyPassword(input.password, admin.passwordHash)) {
          // Slow brute-force attempts and leave an audit trail
          await new Promise((r) => setTimeout(r, 1000));
          Sentry.captureMessage("Failed admin login attempt", {
            level: "warning",
            extra: { username: input.username },
          });
          return { success: false as const, error: "Invalid credentials" };
        }
        const token = await signJWT({
          sub: String(admin.id),
          username: admin.username,
          role: "admin",
        });
        const cookie = getSessionCookie(token);
        ctx.resHeaders.set(
          "Set-Cookie",
          `${cookie.name}=${cookie.value}; Path=${cookie.path}; Max-Age=${cookie.maxAge}; HttpOnly; SameSite=${cookie.sameSite}${cookie.secure ? "; Secure" : ""}`
        );
        return { success: true as const };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.resHeaders.set(
        "Set-Cookie",
        `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=lax`
      );
      return { success: true };
    }),
  }),

  specials: router({
    list: publicProcedure.query(() => listActiveSpecials()),
    listAll: adminProcedure.query(() => listAllSpecials()),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(128),
          description: z.string().max(1000).optional(),
          priceCents: z.number().int().nonnegative().nullable().optional(),
          badge: z.string().max(64).optional(),
          active: z.boolean().default(true),
          expiresAt: z.string().nullable().optional(),
          sortOrder: z.number().int().default(0),
        })
      )
      .mutation(async ({ input }) => {
        return createSpecial({
          title: input.title,
          description: input.description ?? null,
          priceCents: input.priceCents ?? null,
          badge: input.badge ?? null,
          active: input.active,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          sortOrder: input.sortOrder,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          title: z.string().min(1).max(128).optional(),
          description: z.string().max(1000).nullable().optional(),
          priceCents: z.number().int().nonnegative().nullable().optional(),
          badge: z.string().max(64).nullable().optional(),
          active: z.boolean().optional(),
          expiresAt: z.string().nullable().optional(),
          sortOrder: z.number().int().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, expiresAt, ...rest } = input;
        await updateSpecial(id, {
          ...rest,
          ...(expiresAt !== undefined
            ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
            : {}),
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteSpecial(input.id);
        return { success: true };
      }),
  }),

  orders: router({
    place: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1).max(128),
          customerPhone: z.string().min(7).max(32),
          customerEmail: z.string().email().max(320).optional(),
          pickupTime: z.string().min(1).max(64),
          notes: z.string().max(500).optional(),
          items: z.array(cartItemSchema).min(1).max(50),
          tipCents: z.number().int().nonnegative().max(50_000).default(0),
          smsOptIn: z.boolean().default(false),
          // Online orders are prepaid only — a Square card token is mandatory.
          paymentToken: z.string().min(1),
          idempotencyKey: z.string().uuid(),
        })
      )
      .mutation(async ({ input }) => {
        if (!VALID_PICKUP_TIMES.has(input.pickupTime)) {
          throw new Error("Please pick a valid pickup time.");
        }

        const orderNumber = orderNumberFromKey(input.idempotencyKey);

        // Same idempotency key resubmitted (double-click, network retry):
        // return the already-placed order instead of charging again.
        const existing = await getOrderByNumber(orderNumber);
        if (existing) {
          return {
            orderNumber: existing.order.orderNumber,
            totalCents: existing.order.totalCents,
            status: existing.order.status,
            squareSynced: !!existing.order.squareOrderId,
            paid: existing.order.paymentStatus === "paid",
            createdAt: existing.order.createdAt,
          };
        }

        // Never trust client prices — re-price every item server-side.
        const pricing = await validateCartPricing(input.items);
        if (!pricing.ok) {
          throw new Error(pricing.reason);
        }
        const totalCents = pricing.totalCents;

        const squareLineItems = input.items.map((item) => ({
          name: item.customizations ? `${item.name} (${item.customizations})` : item.name,
          quantity: String(item.quantity),
          base_price_money: { amount: item.priceCents, currency: "CAD" },
        }));

        let squareOrderId: string | null = null;
        let squarePaymentId: string | null = null;
        let paymentStatus: "unpaid" | "paid" | "failed" = "unpaid";
        let paymentMethod: string | null = null;
        const squareToken = process.env.SQUARE_ACCESS_TOKEN;
        const squareLocation = process.env.SQUARE_LOCATION_ID;

        if (!squareToken || !squareLocation) {
          Sentry.captureMessage("Square env missing at runtime — cannot take payment", {
            level: "error",
            extra: {
              hasToken: !!squareToken,
              hasLocation: !!squareLocation,
              tokenLen: squareToken?.length ?? 0,
              orderNumber,
            },
          });
          throw new Error("Payment processing is unavailable right now. Please try again shortly.");
        }

        squareOrderId = await createSquareOrder(squareToken, squareLocation, {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          pickupTime: input.pickupTime,
          orderNumber,
          lineItems: squareLineItems,
          totalCents,
          idempotencyKey: `${input.idempotencyKey}-order`,
        });

        // Square charges amount_money + tip_money, so pass the order amount
        // here and let createSquarePayment add the tip separately.
        const result = await createSquarePayment(squareToken, squareLocation, {
          sourceId: input.paymentToken,
          amountCents: totalCents,
          orderId: squareOrderId,
          orderNumber,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          tipCents: input.tipCents,
          idempotencyKey: input.idempotencyKey,
        });

        if ("paymentId" in result) {
          squarePaymentId = result.paymentId;
          paymentStatus = "paid";
          paymentMethod = "card";
        } else {
          throw new Error(result.error);
        }

        // The card is already charged past this point — a DB failure here must
        // never read as "try again" to the customer (that double-charges them;
        // happened 2026-06-07, order SC-AMKXFT4T).
        let order;
        try {
          order = await createOrder(
            {
              orderNumber,
              customerName: input.customerName,
              customerPhone: input.customerPhone,
              customerEmail: input.customerEmail ?? null,
              pickupTime: input.pickupTime,
              totalCents,
              tipCents: input.tipCents,
              status: "pending",
              paymentStatus,
              paymentMethod,
              squareOrderId,
              squarePaymentId,
              smsOptIn: input.smsOptIn,
              notes: input.notes ?? null,
            },
            input.items.map((item) => ({
              orderId: 0,
              itemName: item.customizations ? `${item.name} (${item.customizations})` : item.name,
              itemCategory: item.category,
              priceCents: item.priceCents,
              quantity: item.quantity,
            }))
          );
        } catch (err) {
          // A concurrent duplicate submit loses the unique(order_number) race —
          // the order exists and the charge was idempotent, so report success.
          const raced = await getOrderByNumber(orderNumber).catch(() => null);
          if (raced) {
            return {
              orderNumber: raced.order.orderNumber,
              totalCents: raced.order.totalCents,
              status: raced.order.status,
              squareSynced: !!raced.order.squareOrderId,
              paid: raced.order.paymentStatus === "paid",
              createdAt: raced.order.createdAt,
            };
          }
          Sentry.captureException(err, {
            level: "fatal",
            extra: {
              where: "createOrder after successful card charge",
              orderNumber,
              squareOrderId,
              squarePaymentId,
              totalCents,
              tipCents: input.tipCents,
            },
          });
          throw new Error(
            `Your payment WAS processed, but we hit a problem confirming the order. Please do NOT submit it again — mention order #${orderNumber} at the truck and we'll sort it out.`
          );
        }

        // Send emails (fire and forget)
        const emailItems = input.items.map((i) => ({
          name: i.customizations ? `${i.name} (${i.customizations})` : i.name,
          quantity: i.quantity,
          priceCents: i.priceCents,
        }));

        const reportNotifyFailure = (channel: string) => (err: unknown) => {
          Sentry.captureException(err, {
            level: "warning",
            extra: { where: `order notification: ${channel}`, orderNumber },
          });
        };

        sendOrderNotificationToOwner({
          orderNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          pickupTime: input.pickupTime,
          totalCents,
          items: emailItems,
          notes: input.notes,
        }).catch(reportNotifyFailure("owner email"));

        if (input.customerEmail) {
          sendOrderConfirmationToCustomer(input.customerEmail, {
            orderNumber,
            customerName: input.customerName,
            pickupTime: input.pickupTime,
            totalCents,
            items: emailItems,
          }).catch(reportNotifyFailure("customer email"));
        }

        // SMS notifications (fire and forget)
        if (input.smsOptIn) {
          sendOrderConfirmationSMS(input.customerPhone, {
            orderNumber,
            pickupTime: input.pickupTime,
            totalCents,
          }).catch(reportNotifyFailure("customer SMS"));
        }

        sendNewOrderSMSToOwner({
          orderNumber,
          customerName: input.customerName,
          totalCents,
          itemCount: input.items.reduce((sum, i) => sum + i.quantity, 0),
        }).catch(reportNotifyFailure("owner SMS"));

        return {
          orderNumber: order.orderNumber,
          totalCents: order.totalCents,
          status: order.status,
          squareSynced: !!squareOrderId,
          paid: paymentStatus === "paid",
          createdAt: order.createdAt,
        };
      }),

    get: publicProcedure
      .input(z.object({ orderNumber: z.string().max(32) }))
      .query(async ({ input }) => {
        const result = await getOrderByNumber(input.orderNumber);
        if (!result) return null;
        // Public endpoint: expose only what the confirmation page renders —
        // no email, no Square IDs, phone masked to the last 4 digits.
        const o = result.order;
        const digits = o.customerPhone.replace(/\D/g, "");
        return {
          order: {
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            customerPhone: `•••-${digits.slice(-4)}`,
            pickupTime: o.pickupTime,
            status: o.status,
            notes: o.notes,
            totalCents: o.totalCents,
            tipCents: o.tipCents,
            createdAt: o.createdAt,
          },
          items: result.items.map((i) => ({
            id: i.id,
            itemName: i.itemName,
            itemCategory: i.itemCategory,
            priceCents: i.priceCents,
            quantity: i.quantity,
          })),
        };
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          orderNumber: z.string(),
          status: z.enum(["pending", "preparing", "ready", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        const updated = await updateOrderStatus(input.orderNumber, input.status);
        if (!updated) return { success: false };

        // If marked ready, notify customer
        if (input.status === "ready") {
          if (updated.customerEmail) {
            sendOrderReadyNotification(updated.customerEmail, {
              orderNumber: updated.orderNumber,
              customerName: updated.customerName,
            }).catch(() => {});
          }
          if (updated.smsOptIn && updated.customerPhone) {
            sendOrderReadySMS(updated.customerPhone, {
              orderNumber: updated.orderNumber,
              customerName: updated.customerName,
            }).catch(() => {});
          }
        }

        return { success: true, order: updated };
      }),

    recent: adminProcedure.query(() => listRecentOrders(50)),

    pendingCount: publicProcedure.query(() => getPendingOrderCount()),
  }),

  soldOut: router({
    list: publicProcedure.query(() => getSoldOutItems()),

    set: adminProcedure
      .input(z.object({ menuItemId: z.string() }))
      .mutation(async ({ input }) => {
        await setSoldOut(input.menuItemId);
        return { success: true };
      }),

    remove: adminProcedure
      .input(z.object({ menuItemId: z.string() }))
      .mutation(async ({ input }) => {
        await removeSoldOut(input.menuItemId);
        return { success: true };
      }),
  }),

  dashboard: router({
    stats: adminProcedure
      .input(z.object({ daysBack: z.number().int().min(1).max(90).default(7) }).optional())
      .query(async ({ input }) => {
        return getDailySalesStats(input?.daysBack ?? 7);
      }),

    subscriberCount: adminProcedure.query(() => getSubscriberCount()),
  }),

  subscribers: router({
    subscribe: publicProcedure
      .input(
        z.object({
          email: z.string().email().max(320),
          name: z.string().max(128).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await addEmailSubscriber({
          email: input.email,
          name: input.name ?? null,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
