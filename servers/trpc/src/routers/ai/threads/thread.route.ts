import z from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { threadInsertSchema, threads } from "@rhiva-ag/datasource";

import { router, privateProcedure } from "../../../trpc";

export const threadRoute = router({
  create: privateProcedure
    .input(threadInsertSchema.omit({ user: true }))
    .mutation(async ({ ctx, input }) => {
      const [thread] = await ctx.drizzle
        .insert(threads)
        .values({ ...input, user: ctx.user.id })
        .returning();

      if (thread) return thread;

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "thread not created",
      });
    }),
  list: privateProcedure
    .input(
      z
        .object({
          limit: z.number().int(),
          offset: z.number().int(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.drizzle.query.threads.findMany({
        where: eq(threads.user, ctx.user.id),
        ...input,
      });
    }),
});
