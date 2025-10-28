import { jsonb, pgTable, text, unique } from "drizzle-orm/pg-core";
import { mints } from "./mints";

type Extra = {
  binId: number;
  currentPrice: number;
};

export const pools = pgTable("pools", {
  id: text().primaryKey(),
  addressLookupTables: text().array(),
  dex: text({
    enum: ["saros-dlmm", "raydium-clmm", "orca", "meteora"],
  }).notNull(),
  rewardTokens: text().array(),
  baseToken: text()
    .references(() => mints.id, { onDelete: "restrict" })
    .notNull(),
  quoteToken: text()
    .references(() => mints.id, { onDelete: "restrict" })
    .notNull(),
  config: jsonb().$type<{ extra?: Extra }>().notNull(),
});

export const poolRewardTokens = pgTable(
  "pool_reward_tokens",
  {
    pool: text()
      .references(() => pools.id, { onDelete: "cascade" })
      .notNull(),
    mint: text()
      .references(() => mints.id, { onDelete: "cascade" })
      .notNull(),
  },
  (column) => [unique().on(column.pool, column.mint)],
);
