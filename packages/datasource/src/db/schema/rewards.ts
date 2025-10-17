import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const rewards = pgTable("rewards", {
  id: uuid().defaultRandom().notNull(),
  user: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  key: text({
    enum: [
      "swap",
      "7_days_streak",
      "1_month_streak",
      "onboarding",
      "create_position",
      "referral",
      "custom",
    ],
  }).notNull(),
  xp: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
