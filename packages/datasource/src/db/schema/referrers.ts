import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const referrers = pgTable(
  "referrers",
  {
    referer: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    user: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .unique()
      .notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (column) => [unique().on(column.user, column.referer).nullsNotDistinct()],
);
