import { and, count, eq, gt, lt, sum, type SQL } from "drizzle-orm";
import {
  buildDrizzleWhereClauseFromObject,
  caseWhen,
  coalesce,
  day,
  pnls,
  positions,
} from "@rhiva-ag/datasource";

import { pnlFilterSchema } from "./pnl.schema";
import { privateProcedure, router } from "../../trpc";

export const pnlRoute = router({
  aggregrate: privateProcedure.query(async ({ ctx }) => {
    const [totalPNLs] = await ctx.drizzle
      .select({
        lossCount: count(caseWhen(lt(pnls.pnlUsd, 0), 1)),
        profitCount: count(caseWhen(gt(pnls.pnlUsd, 0), 1)),
        feeUsd: coalesce(sum(pnls.feeUsd), 0).mapWith(Number),
        rewardUsd: coalesce(sum(pnls.rewardUsd), 0).mapWith(Number),
        amountUsd: coalesce(sum(positions.amountUsd), 0).mapWith(Number),
        lossUsd: coalesce(
          sum(caseWhen(lt(pnls.pnlUsd, 0), pnls.pnlUsd)),
          0,
        ).mapWith(Number),
        profitUsd: coalesce(
          sum(caseWhen(gt(pnls.pnlUsd, 0), pnls.pnlUsd)),
          0,
        ).mapWith(Number),
      })
      .from(pnls)
      .innerJoin(positions, eq(positions.id, pnls.position))
      .execute();

    return totalPNLs;
  }),
  history: privateProcedure.input(pnlFilterSchema).query(({ ctx, input }) => {
    let where: SQL<unknown> | undefined;
    if (input) where = and(...buildDrizzleWhereClauseFromObject(input));
    const dayColumn = day(pnls.createdAt);
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
});
