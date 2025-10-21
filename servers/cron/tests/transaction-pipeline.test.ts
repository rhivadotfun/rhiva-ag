import type z from "zod";
import { createSolanaRpc } from "@solana/kit";
import { mapFilter } from "@rhiva-ag/shared";
import { Connection, PublicKey } from "@solana/web3.js";
import Coingecko from "@coingecko/coingecko-typescript";
import { describe, beforeAll, test, afterAll, expect } from "bun:test";
import {
  createDB,
  positions,
  type walletSelectSchema,
  type Database,
} from "@rhiva-ag/datasource";

import { getEnv } from "../src/env";
import { createTransactionPipeline } from "../src/workers/transaction.worker";

describe("transaction pipeline", () => {
  let db: Database;
  let coingecko: Coingecko;
  let connection: Connection;
  let wallet: z.infer<typeof walletSelectSchema> | undefined;
  let pipeline: ReturnType<typeof createTransactionPipeline>;

  beforeAll(async () => {
    db = createDB(getEnv("DATABASE_URL"));
    coingecko = new Coingecko({
      environment: "pro",
      proAPIKey: getEnv("COINGECKO_API_KEY"),
    });
    connection = new Connection(getEnv("SOLANA_RPC_URL"));
    wallet = await db.query.wallets.findFirst();
    pipeline = createTransactionPipeline({
      db,
      connection,
      coingecko,
      wallet: wallet!,
      rpc: createSolanaRpc(connection.rpcEndpoint),
      positionNftMint: new PublicKey(
        "oX5vYqFVJZS549PPGTD3Qoqzq4684XzNjwgvaRydinx",
      ),
    });
  });

  afterAll(async () => {
    await db.delete(positions);
  });

  test("pipeline should pass", async () => {
    const transactions = await connection.getParsedTransactions(
      [
        "wcS2tmMLBhr1UeQa8V3i5rtfQDfJyiWY7sTqq1MGDBXqALq9daVcc2DBiwYnL2q9coGbaibLyiC8tFV326T5FLX",
        "3mZQFmjUBuwFyyejVJFYEUU9AwgigwH52K5icijC9T1qa9NsyC1zS6cHDdnYbTUnA9MscPMgjuEtM9TVD4RWFRT6",
        "2C3yQVus1aeErteHBnP7JCSRRqiT4ASEZp4vCy2N5Rt5FoQVD1hFSx61iLqPLe4kSzXJecxxdzUYogxUCPM9VtVc",
      ],
      { maxSupportedTransactionVersion: 0 },
    );

    const response = await pipeline.process(
      ...mapFilter(transactions, (transaction) => transaction),
    );

    expect(response.flat(4)).toHaveLength(4);
  });
});
