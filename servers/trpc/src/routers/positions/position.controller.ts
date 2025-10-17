import type z from "zod";
import moment from "moment";
import { and, avg, eq, gt, lt, not, sum, type SQL } from "drizzle-orm";
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
  return db.query.positions.findMany({
    with: {
      pnls: {
        limit: 1,
        orderBy: pnls.createdAt,
      },
      pool: {
        columns: {
          id: true,
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
  });
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
      avgInvestedUsd: coalesce(avg(positions.amountUsd), 0),
      lossUsd: coalesce(
        sum(int(caseWhen(lt(qPnls.pnlUsd, 0), qPnls.pnlUsd))),
        0,
      ).mapWith(Number),
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
