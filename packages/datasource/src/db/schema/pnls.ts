import { doublePrecision, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { positions } from "./positions";

export const pnls = pgTable("pnls", {
  position: text()
    .references(() => positions.id)
    .notNull(),
  state: text({ enum: ["closed", "opened"] }),
  feeUsd: doublePrecision().notNull(),
  pnlUsd: doublePrecision().notNull(),
  rewardUsd: doublePrecision().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
