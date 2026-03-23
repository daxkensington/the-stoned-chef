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
} from "./db";
import { createSquareOrder } from "./square";
import { nanoid } from "nanoid";
import { verifyPassword, signJWT, getSessionCookie } from "./_core/auth";
import { COOKIE_NAME } from "@shared/const";

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  priceCents: z.number().int().positive(),
  quantity: z.number().int().positive(),
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
          pickupTime: z.string().min(1).max(64),
          notes: z.string().max(500).optional(),
          items: z.array(cartItemSchema).min(1),
        })
      )
      .mutation(async ({ input }) => {
        const orderNumber = `SC-${nanoid(8).toUpperCase()}`;
        const totalCents = input.items.reduce(
          (sum, item) => sum + item.priceCents * item.quantity,
          0
        );

        const squareLineItems = input.items.map((item) => ({
          name: item.name,
          quantity: String(item.quantity),
          base_price_money: { amount: item.priceCents, currency: "CAD" },
        }));

        let squareOrderId: string | null = null;
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
        }

        const order = await createOrder(
          {
            orderNumber,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            pickupTime: input.pickupTime,
            totalCents,
            status: "pending",
            squareOrderId,
            notes: input.notes ?? null,
          },
          input.items.map((item) => ({
            orderId: 0, // set by createOrder
            itemName: item.name,
            itemCategory: item.category,
            priceCents: item.priceCents,
            quantity: item.quantity,
          }))
        );

        return {
          orderNumber: order.orderNumber,
          totalCents: order.totalCents,
          status: order.status,
          squareSynced: !!squareOrderId,
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
  }),
});

export type AppRouter = typeof appRouter;
