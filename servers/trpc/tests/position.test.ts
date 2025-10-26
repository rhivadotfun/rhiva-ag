import { beforeAll, describe, test } from "bun:test";
import { createDB, type Database } from "@rhiva-ag/datasource";

import { getEnv } from "../src/env";
import { getWalletPositions } from "../src/external";

describe("position", async () => {
  let db: Database;
  beforeAll(async () => {
    db = createDB(getEnv("DATABASE_URL"));
  });

  test("position", async () => {
    const positions = await getWalletPositions(
      db,
      "BMQGmC2B3ZVMmTj3iT24Yjb4LvYjHimfwaHkThgufnJv",
    );
    console.log(positions, { depth: null });
  });
});
