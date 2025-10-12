import z from "zod";
import { and, eq, type SQL } from "drizzle-orm";
import {
  buildDrizzleWhereClauseFromObject,
  buildOrderByClauseFromObject,
  users,
} from "@rhiva-ag/datasource";

import { privateProcedure, router } from "../../trpc";
import {
  notificationFilterSchema,
  notificationSortSchema,
} from "./notification.schema";

export const notificationRoute = router({
  list: privateProcedure
    .input(
      z.object({
        limit: z.number(),
        offset: z.number(),
        sortBy: notificationSortSchema.optional(),
        filter: notificationFilterSchema.partial().optional(),
      }),
    )
    .query(({ ctx, input: { filter, sortBy, ...input } }) => {
      let where: SQL<unknown> | undefined;
      let orderBy: SQL<unknown>[] | undefined;

      if (filter) where = and(...buildDrizzleWhereClauseFromObject(filter));

      if (sortBy) orderBy = buildOrderByClauseFromObject(sortBy);

      return ctx.drizzle.query.notifications.findMany({
        orderBy,
        where: and(eq(users.id, ctx.user.id), where),
        ...input,
      });
    }),
});
