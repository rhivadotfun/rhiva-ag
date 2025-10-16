import {
  doublePrecision,
  pgTable,
  text,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { positions } from "./positions";

export const pnls = pgTable(
  "pnls",
  {
    position: text()
      .references(() => positions.id, { onDelete: "cascade" })
      .notNull(),
    state: text({ enum: ["closed", "opened"] }).notNull(),
    amountUsd: doublePrecision().notNull(),
    claimedFeeUsd: doublePrecision().notNull(),
    feeUsd: doublePrecision().notNull(),
    pnlUsd: doublePrecision().notNull(),
    rewardUsd: doublePrecision().notNull(),
    createdAt: date().defaultNow().notNull(),
  },
  (column) => [unique().on(column.position, column.createdAt)],
);
