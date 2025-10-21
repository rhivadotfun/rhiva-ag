import z from "zod";
import { run } from "@openai/agents";
import { and, desc, eq, type SQL } from "drizzle-orm";
import {
  buildDrizzleWhereClauseFromObject,
  buildOrderByClauseFromObject,
  messages,
  threads,
  threadSelectSchema,
} from "@rhiva-ag/datasource";

import { privateProcedure, router } from "../../../trpc";
import { messageFilterSchema, messageSortSchema } from "./message.schema";

export const messageRoute = router({
  create: privateProcedure
    .input(
      z.object({
        prompt: z.string(),
        thread: threadSelectSchema.shape.id,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const histories = await ctx.drizzle.query.messages
        .findMany({
          limit: 4,
          columns: {
            role: true,
            content: true,
          },
          orderBy: desc(messages.createdAt),
          where: eq(messages.thread, input.thread),
        })
        .execute();
      const context = [
        ...histories.reverse(),
        {
          role: "user",
          content: input.prompt,
        },
      ];
      const agent = await ctx.mcpClient.createAgent();
      const response = await run(agent, context);
      return ctx.drizzle
        .insert(messages)
        .values([
          {
            role: "user",
            thread: input.thread,
            content: { text: input.prompt },
          },
          {
            role: "assistant",
            thread: input.thread,
            // todo: switch to ai / @ai-sdk. @openi/agents is not stable
            content: response.finalOutput as any,
          },
        ])
        .returning();
    }),
  list: privateProcedure
    .input(
      z
        .object({
          limit: z.number().int().optional(),
          offset: z.number().int().optional(),
          sortBy: messageSortSchema.optional(),
          filter: messageFilterSchema.partial().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      let where: (SQL<unknown> | undefined)[] | undefined,
        orderBy: SQL<unknown>[] | undefined;
      if (input) {
        if (input.sortBy) orderBy = buildOrderByClauseFromObject(input.sortBy);
        if (input.filter)
          where = buildDrizzleWhereClauseFromObject(input.filter);
      }

      return ctx.drizzle.query.messages.findMany({
        orderBy,
        limit: input?.limit,
        offset: input?.offset,
        where: where ? and(...where, eq(threads.user, ctx.user.id)) : undefined,
        with: {
          thread: {
            column: {
              user: true,
            },
          },
        },
      });
    }),
});
