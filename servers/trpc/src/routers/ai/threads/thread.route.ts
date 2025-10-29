import z from "zod";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { threadInsertSchema, threads } from "@rhiva-ag/datasource";

import { getEnv } from "../../../env";
import { router, privateProcedure } from "../../../trpc";

export const threadRoute = router({
  create: privateProcedure
    .input(threadInsertSchema.omit({ id: true, user: true }))
    .mutation(async ({ ctx, input }) => {
      const client = new OpenAI({
        apiKey: getEnv("OPEN_API_KEY"),
      });
      const conversation = await client.conversations.create({});
      const [thread] = await ctx.drizzle
        .insert(threads)
        .values({ ...input, id: conversation.id, user: ctx.user.id })
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
