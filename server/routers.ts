import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
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
import { nanoid } from "nanoid";
import { verifyPassword, signJWT, getSessionCookie } from "./_core/auth";
import { COOKIE_NAME } from "@shared/const";

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  priceCents: z.number().int().positive(),
  quantity: z.number().int().positive(),
  customizations: z.string().optional(),
});

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
          items: z.array(cartItemSchema).min(1),
          tipCents: z.number().int().nonnegative().default(0),
          smsOptIn: z.boolean().default(false),
          paymentToken: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const orderNumber = `SC-${nanoid(8).toUpperCase()}`;
        const totalCents = input.items.reduce(
          (sum, item) => sum + item.priceCents * item.quantity,
          0
        );

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

        if (squareToken && squareLocation) {
          squareOrderId = await createSquareOrder(squareToken, squareLocation, {
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            pickupTime: input.pickupTime,
            orderNumber,
            lineItems: squareLineItems,
            totalCents,
          });

          // Process card payment if token provided
          if (input.paymentToken) {
            const chargeAmount = totalCents + input.tipCents;
            const result = await createSquarePayment(squareToken, squareLocation, {
              sourceId: input.paymentToken,
              amountCents: chargeAmount,
              orderId: squareOrderId,
              orderNumber,
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              tipCents: input.tipCents,
            });

            if ("paymentId" in result) {
              squarePaymentId = result.paymentId;
              paymentStatus = "paid";
              paymentMethod = "card";
            } else {
              throw new Error(result.error);
            }
          }
        }

        const order = await createOrder(
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

        // Send emails (fire and forget)
        const emailItems = input.items.map((i) => ({
          name: i.customizations ? `${i.name} (${i.customizations})` : i.name,
          quantity: i.quantity,
          priceCents: i.priceCents,
        }));

        sendOrderNotificationToOwner({
          orderNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          pickupTime: input.pickupTime,
          totalCents,
          items: emailItems,
          notes: input.notes,
        }).catch(() => {});

        if (input.customerEmail) {
          sendOrderConfirmationToCustomer(input.customerEmail, {
            orderNumber,
            customerName: input.customerName,
            pickupTime: input.pickupTime,
            totalCents,
            items: emailItems,
          }).catch(() => {});
        }

        // SMS notifications (fire and forget)
        if (input.smsOptIn) {
          sendOrderConfirmationSMS(input.customerPhone, {
            orderNumber,
            pickupTime: input.pickupTime,
            totalCents,
          }).catch(() => {});
        }

        sendNewOrderSMSToOwner({
          orderNumber,
          customerName: input.customerName,
          totalCents,
          itemCount: input.items.reduce((sum, i) => sum + i.quantity, 0),
        }).catch(() => {});

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
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        const result = await getOrderByNumber(input.orderNumber);
        if (!result) return null;
        return { order: result.order, items: result.items };
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
