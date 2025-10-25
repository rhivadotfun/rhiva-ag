import crypto from "crypto";
import { format } from "util";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  email: text(),
  displayName: text(),
  currentStreak: integer().default(1).notNull(),
  uid: text().unique().notNull(),
  // todo:
  referralCode: text()
    .$defaultFn(() => {
      const uuid = crypto.randomUUID();
      const ref = uuid.slice(0, 3);
      return format("RHI%s", ref).toUpperCase();
    })
    .notNull(),
  id: uuid().primaryKey().defaultRandom(),
  lastLogin: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
