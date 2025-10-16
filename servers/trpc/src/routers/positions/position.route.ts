import z from "zod";
import { and, desc, eq, getTableColumns, type SQL } from "drizzle-orm";
import {
  buildDrizzleWhereClauseFromObject,
  buildOrderByClauseFromObject,
  pnls,
  positions,
  wallets,
} from "@rhiva-ag/datasource";

import { orcaRoute } from "./orca/orca.route";
import { meteoraRoute } from "./meteora/meteora.route";
import { raydiumRoute } from "./raydium/raydium.route";
import { privateProcedure, router } from "../../trpc";
import { positionFilterSchema, positionSortSchema } from "./position.schema";

export const positionRoute = router({
  orca: orcaRoute,
  raydium: raydiumRoute,
  meteora: meteoraRoute,
  aggregrate: privateProcedure.query(() => {}),
  list: privateProcedure
    .input(
      z.object({
        limit: z.number(),
        offset: z.number(),
        sortBy: positionSortSchema,
        filter: positionFilterSchema.partial(),
      }),
    )
    .query(({ ctx, input: { sortBy, filter, ...input } }) => {
      let where: SQL<unknown> | undefined;
      let orderBy: SQL<unknown>[] | undefined;

      if (sortBy) orderBy = buildOrderByClauseFromObject(sortBy);
      if (filter) where = and(...buildDrizzleWhereClauseFromObject(filter));

      const qWallets = ctx.drizzle
        .select()
        .from(wallets)
        .where(eq(wallets.user, ctx.user.id))
        .as("qWallets");

      const qPnls = ctx.drizzle
        .select()
        .from(pnls)
        .orderBy(desc(pnls.createdAt))
        .limit(1)
        .as("qPnls");

      const query = ctx.drizzle
        .select({
          ...getTableColumns(positions),
          pnl: getTableColumns(pnls),
        })
        .from(positions)
        .where(where)
        .innerJoin(qPnls, eq(qPnls.position, positions.id))
        .innerJoin(qWallets, eq(qWallets.id, positions.wallet));

      if (orderBy) query.orderBy(...orderBy);
      if (input.limit) query.limit(input.limit);
      if (input.offset) query.offset(input.offset);

      return query.execute();
    }),
});
