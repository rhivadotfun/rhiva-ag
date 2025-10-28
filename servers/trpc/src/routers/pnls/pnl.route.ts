import { and, gte, lte, sum } from "drizzle-orm";
import { coalesce, date, pnls } from "@rhiva-ag/datasource";

import { pnlFilterSchema } from "./pnl.schema";
import { orcaRoute } from "./orca/orca.router";
import { privateProcedure, router } from "../../trpc";
import { meteoraRoute } from "./meteora/meteora.router";
import { raydiumRoute } from "./raydium/raydium.router";

export const pnlRoute = router({
  history: privateProcedure.input(pnlFilterSchema).query(({ ctx, input }) => {
    const dayColumn = date(pnls.createdAt);
    return ctx.drizzle
      .select({
        day: dayColumn,
        pnlUsd: coalesce(sum(pnls.pnlUsd), 0).mapWith(Number),
      })
      .from(pnls)
      .groupBy(dayColumn)
      .orderBy(dayColumn)
      .where(
        and(
          gte(pnls.createdAt, input.start.toISOString()),
          lte(pnls.createdAt, input.end.toISOString()),
        ),
      )
      .execute();
  }),
  orca: orcaRoute,
  meteora: meteoraRoute,
  raydium: raydiumRoute,
});
