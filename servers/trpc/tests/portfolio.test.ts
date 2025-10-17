import type z from "zod";
import { beforeAll, describe, test } from "bun:test";
import {
  createDB,
  type walletSelectSchema,
  type Database,
} from "@rhiva-ag/datasource";

import { getEnv } from "../src/env";
import {
  getWalletPositions,
  getWalletPositionsAggregrate,
} from "../src/routers/positions/position.controller";
describe("porfolio", () => {
  let db: Database;
  let wallet: z.infer<typeof walletSelectSchema> | undefined;

  beforeAll(async () => {
    db = createDB(getEnv("DATABASE_URL"));
    wallet = await db.query.wallets.findFirst();
  });

  test("position aggregrate", async () => {
    if (!wallet) return;

    const positions = await getWalletPositions(db, wallet.id);
    const aggregate = await getWalletPositionsAggregrate(db, wallet.id);
    console.log(positions, aggregate);
  });
});
