import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { FetchContext } from "./context-fetch";

const t = initTRPC.context<FetchContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { ...ctx, admin: ctx.admin } });
});

export const adminProcedure = t.procedure.use(requireAdmin);
