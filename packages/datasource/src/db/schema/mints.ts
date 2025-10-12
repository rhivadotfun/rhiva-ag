import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const mints = pgTable("mints", {
  id: text().primaryKey(),
  decimals: integer().notNull(),
  tokenProgram: text().notNull(),
});
