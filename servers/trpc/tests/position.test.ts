import { beforeAll, describe, test } from "bun:test";
import { createDB, date, pnls, type Database } from "@rhiva-ag/datasource";

import { getEnv } from "../src/env";
import { getWalletPositions } from "../src/external";
import { sum } from "drizzle-orm";

describe("position", async () => {
  let db: Database;
  beforeAll(async () => {
    db = createDB(getEnv("DATABASE_URL"));
  });

  test("position", async () => {
    const dayColumn = date(pnls.createdAt);
    const pnl = await db
      .select({
        day: dayColumn,
        feeUsd: sum(pnls.feeUsd),
        rewardUsd: sum(pnls.feeUsd),
        profitUsd: sum(pnls.pnlUsd),
      })
      .from(pnls)
      .groupBy(dayColumn)
      .orderBy(dayColumn)
      .execute();
    console.log(pnl, { depth: null });
  });
});
