import {
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { pools } from "./pools";
import { wallets } from "./wallets";

export const positions = pgTable("positions", {
  id: text().primaryKey().notNull(),
  amountUsd: doublePrecision().notNull(),
  baseAmount: doublePrecision().notNull(),
  quoteAmount: doublePrecision().notNull(),
  config: jsonb().$type<object>().notNull(),
  wallet: text()
    .references(() => wallets.id, { onDelete: "cascade" })
    .notNull(),
  pool: text().references(() => pools.id, { onDelete: "set null" }),
  state: text({ enum: ["pending", "error", "successful"] }).notNull(),
  status: text({
    enum: ["idle", "open", "rebalanced", "repositioned", "closed"],
  }).notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
