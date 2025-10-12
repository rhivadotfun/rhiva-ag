import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { MegafilterGetParams } from "@coingecko/coingecko-typescript/resources/onchain/pools/megafilter.js";

import { users } from "./users";

export const poolFilters = pgTable("poolFilters", {
  id: uuid().defaultRandom().primaryKey(),
  name: text(),
  data: jsonb().$type<MegafilterGetParams>().notNull(),
  user: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
