import {
  boolean,
  doublePrecision,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const settings = pgTable("settings", {
  user: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .primaryKey()
    .notNull(),
  slippage: doublePrecision().default(0.5).notNull(),
  rebalanceTime: doublePrecision().default(60).notNull(),
  gasPriorityFee: doublePrecision().default(0.0001).notNull(),
  enableAutoClaim: boolean().default(false).notNull(),
  enableAutoCompound: boolean().default(false).notNull(),
  enableNotifications: boolean().default(true).notNull(),
  rebalanceType: text({ enum: ["swap", "swapless"] })
    .default("swapless")
    .notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
