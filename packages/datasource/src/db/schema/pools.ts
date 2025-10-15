import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { mints } from "./mints";

export const pools = pgTable("pools", {
  id: text().primaryKey(),
  addressLookupTables: text().array(),
  dex: text({
    enum: ["saros-dlmm", "raydium-clmm", "orca", "meteora"],
  }).notNull(),
  baseToken: text()
    .references(() => mints.id, { onDelete: "restrict" })
    .notNull(),
  quoteToken: text()
    .references(() => mints.id, { onDelete: "restrict" })
    .notNull(),
  config: jsonb().$type<object>().notNull(),
});
