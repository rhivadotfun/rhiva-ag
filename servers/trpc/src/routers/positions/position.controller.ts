import type z from "zod";
import moment from "moment";
import { and, avg, count, eq, gt, lt, not, sum, type SQL } from "drizzle-orm";
import {
  pnls,
  wallets,
  type walletSelectSchema,
  type Database,
  positions,
  caseWhen,
  int,
  coalesce,
} from "@rhiva-ag/datasource";

export const getWalletPositions = async (
  db: Database,
  wallet: z.infer<typeof walletSelectSchema>["id"],
  extra?: {
    limit?: number;
    offset?: number;
    where?: SQL<unknown>;
    orderBy?: SQL<unknown>[];
  },
) => {
  const totalQuery = db
    .select({
      count: count(positions.id),
    })
    .from(positions)
    .where(and(eq(positions.wallet, wallet), extra?.where));
  if (extra?.orderBy) totalQuery.orderBy(...extra.orderBy);
  const [total] = await totalQuery.execute();

  const items = await db.query.positions
    .findMany({
      with: {
        pnls: {
          limit: 1,
          orderBy: pnls.createdAt,
        },
        pool: {
          columns: {
            id: true,
            dex: true,
          },
          with: {
            baseToken: true,
            quoteToken: true,
            rewardTokens: {
              with: {
                mint: true,
              },
            },
          },
        },
      },
      columns: {
        pool: false,
      },
      ...extra,
      where: and(eq(wallets.id, wallet), extra?.where),
    })
    .execute();

  return {
    items,
    total: total?.count,
  };
};

export const getWalletPositionsAggregrate = (
  db: Database,
  wallet: z.infer<typeof walletSelectSchema>["id"],
) => {
  const qPnls = db
    .select()
    .from(pnls)
    .limit(1)
    .orderBy(pnls.createdAt)
    .as("qPnls");
  const month = moment().startOf("month").toDate();

  return db
    .select({
      avgInvestedUsd: coalesce(avg(positions.amountUsd), 0).mapWith(Number),
      lossUsd: coalesce(
        sum(int(caseWhen(lt(qPnls.pnlUsd, 0), qPnls.pnlUsd))),
        0,
      ).mapWith(Number),
      feeUsd: coalesce(sum(qPnls.feeUsd), 0).mapWith(Number),
      profitUsd: coalesce(
        sum(int(caseWhen(gt(qPnls.pnlUsd, 0), qPnls.pnlUsd))),
        0,
      ).mapWith(Number),
      avgMonthlyProfit: coalesce(
        sum(int(caseWhen(gt(positions.createdAt, month), qPnls.pnlUsd))),
        0,
      ).mapWith(Number),
      closed: coalesce(
        sum(int(caseWhen(eq(positions.state, "closed"), 1))),
        0,
      ).mapWith(Number),
      opened: coalesce(
        sum(int(caseWhen(not(eq(positions.state, "closed")), 1))),
        0,
      ).mapWith(Number),
    })
    .from(positions)
    .leftJoin(qPnls, eq(qPnls.position, positions.id))
    .where(eq(positions.wallet, wallet))
    .execute();
};
