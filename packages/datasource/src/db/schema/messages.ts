import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const threads = pgTable("threads", {
  id: text().primaryKey(),
  name: text(),
  user: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

type Response =
  | {
      text?: string;
    }
  | {
      summary?: string;
      positions?: unknown[];
      tokens?: unknown[];
      pools?: unknown[];
    };

export const messages = pgTable("messages", {
  id: uuid().defaultRandom().primaryKey(),
  content: jsonb().$type<Response>().notNull(),
  role: text({ enum: ["user", "system", "assistant"] }).notNull(),
  thread: text()
    .references(() => threads.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
