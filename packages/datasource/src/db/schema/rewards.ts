import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const rewardTypes = pgTable("rewardType", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().unique().notNull(),
  xp: integer().notNull(),
});

export const rewards = pgTable("rewards", {
  id: uuid().defaultRandom().notNull(),
  user: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  rewardType: uuid()
    .references(() => rewardTypes.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
