import {
  doublePrecision,
  pgTable,
  text,
  date,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";
import { positions } from "./positions";

type Extra = {
  rewards?: number[];
  rewardUsd?: number[];
};

export const pnls = pgTable(
  "pnls",
  {
    position: text()
      .references(() => positions.id, { onDelete: "cascade" })
      .notNull(),
    state: text({ enum: ["closed", "opened"] }).notNull(),
    feeUsd: doublePrecision().notNull(),
    pnlUsd: doublePrecision().notNull(),
    rewardUsd: doublePrecision().notNull(),
    createdAt: date().defaultNow().notNull(),
    amountUsd: doublePrecision().notNull(),
    claimedFeeUsd: doublePrecision().notNull(),
    baseAmount: doublePrecision().default(0).notNull(),
    baseAmountUsd: doublePrecision().default(0).notNull(),
    quoteAmount: doublePrecision().default(0).notNull(),
    quoteAmountUsd: doublePrecision().default(0).notNull(),
    unclaimedBaseFee: doublePrecision().default(0).notNull(),
    unclaimedBaseFeeUsd: doublePrecision().default(0).notNull(),
    unclaimedQuoteFee: doublePrecision().default(0).notNull(),
    unclaimedQuoteFeeUsd: doublePrecision().default(0).notNull(),
    config: jsonb().$type<{ extra?: Extra }>(),
  },
  (column) => [unique().on(column.position, column.createdAt)],
);
