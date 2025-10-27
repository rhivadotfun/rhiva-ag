import { and, sum, type SQL } from "drizzle-orm";
import {
  buildDrizzleWhereClauseFromObject,
  date,
  pnls,
} from "@rhiva-ag/datasource";

import { pnlFilterSchema } from "./pnl.schema";
import { orcaRoute } from "./orca/orca.router";
import { privateProcedure, router } from "../../trpc";
import { meteoraRoute } from "./meteora/meteora.router";
import { raydiumRoute } from "./raydium/raydium.router";

export const pnlRoute = router({
  history: privateProcedure.input(pnlFilterSchema).query(({ ctx, input }) => {
    let where: SQL<unknown> | undefined;
    if (input) where = and(...buildDrizzleWhereClauseFromObject(input));
    const dayColumn = date(pnls.createdAt);
    return ctx.drizzle
      .select({
        day: dayColumn,
        feeUsd: sum(pnls.feeUsd),
        rewardUsd: sum(pnls.feeUsd),
        profitUsd: sum(pnls.pnlUsd),
      })
      .from(pnls)
      .groupBy(dayColumn)
      .orderBy(dayColumn)
      .where(where)
      .execute();
  }),
  orca: orcaRoute,
  meteora: meteoraRoute,
  raydium: raydiumRoute,
});
