import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notifications = pgTable("notifications", {
  id: uuid().defaultRandom().notNull(),
  type: text({ enum: ["announcement", "transactions", "alert"] }).notNull(),
  user: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: jsonb()
    .$type<{ external: boolean; text: string; params: Record<string, never> }>()
    .notNull(),
  detail: jsonb()
    .$type<{ external: boolean; text: string; params: Record<string, never> }>()
    .notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
