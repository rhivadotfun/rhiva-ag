import bs58 from "bs58";
import type z from "zod";
import assert from "assert";
import Dex from "@rhiva-ag/dex";
import { address } from "@solana/kit";
import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { Secret, SendTransaction } from "@rhiva-ag/shared";
import { beforeAll, describe, expect, test } from "bun:test";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  createDB,
  type walletSelectSchema,
  type Database,
  wallets,
} from "@rhiva-ag/datasource";

import { getEnv } from "../src/env";
import { closePosition as orcaClosePosition } from "../src/routers/positions/orca/orca.controller";
import { closePosition as meteoraClosePosition } from "../src/routers/positions/meteora/meteora.controller";
import { closePosition as raydiumClosePosition } from "../src/routers/positions/raydium/raydium.controller";
import {
  getWalletPositions,
  getWalletPositionsAggregrate,
} from "../src/routers/positions/position.controller";

describe("porfolio", () => {
  let db: Database;
  let dex: Dex;
  let secret: Secret;
  let owner: Keypair;
  let sender: SendTransaction;
  let connection: Connection;
  let wallet: z.infer<typeof walletSelectSchema> | undefined;

  beforeAll(async () => {
    db = createDB(getEnv("DATABASE_URL"));
    connection = new Connection(getEnv("SOLANA_RPC_URL"));
    sender = new SendTransaction(
      getEnv("HELIUS_API_URL"),
      getEnv("HELIUS_API_KEY"),
      getEnv("JITO_API_URL"),
      getEnv("JITO_UUID"),
    );
    secret = new Secret(getEnv("SECRET_KEY"), {
      ivLength: 32,
      algorithm: "aes-256-gcm",
    });

    wallet = await db.query.wallets.findFirst();
    owner = Keypair.fromSecretKey(bs58.decode(getEnv("DEV_WALLET")));
    dex = new Dex(
      connection,
      await Raydium.load({
        connection,
        owner,
        cluster: "mainnet",
        disableLoadToken: true,
        disableFeatureCheck: true,
      }),
    );
    [wallet] = await db
      .update(wallets)
      .set({
        id: owner.publicKey.toBase58(),
        key: secret.encrypt(owner.secretKey.toBase64()),
      })
      .returning();
  });

  test("position aggregrate", async () => {
    assert(wallet, "wallet can't be null");

    const positions = await getWalletPositions(db, wallet.id);
    const aggregate = await getWalletPositionsAggregrate(db, wallet.id);

    expect(positions).toHaveLength(0);
    expect(aggregate).toHaveLength(1);
  });

  test("orca close position", async () => {
    assert(wallet, "wallet can't be null");
    const { bundleSimulationResponse } = await orcaClosePosition(
      dex,
      sender,
      owner,
      {
        slippage: 50,
        pair: address("Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE"),
        position: address("F8u8KJnsbPaYs8cDkN6S8MyDteHqJHktspV9w8K4zFTB"),
        tokenA: {
          decimals: 9,
          owner: address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          mint: address("So11111111111111111111111111111111111111112"),
        },
        tokenB: {
          decimals: 6,
          owner: address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          mint: address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
        },
        jitoConfig: {
          type: "dynamic",
          priorityFeePercentile: "50ema",
        },
      },
    );

    expect(bundleSimulationResponse.result.value.summary).toBe("succeeded");
    expect(
      bundleSimulationResponse.result.value.transactionResults,
    ).toHaveLength(2);
  });

  test("meteora close position", async () => {
    assert(wallet, "wallet can't be null");

    const { bundleSimulationResponse } = await meteoraClosePosition(
      dex,
      sender,
      owner,
      {
        slippage: 50,
        pair: new PublicKey("BGm1tav58oGcsQJehL9WXBFXF7D27vZsKefj4xJKD5Y"),
        position: new PublicKey("Bwesuhw9faxknQaFxAEdhPTUW9wn7VsLEXx1hHSEkZot"),
        jitoConfig: {
          type: "dynamic",
          priorityFeePercentile: "50ema",
        },
      },
    );

    expect(bundleSimulationResponse.result.value.summary).toBe("succeeded");
    expect(
      bundleSimulationResponse.result.value.transactionResults,
    ).toHaveLength(2);
  });

  test("raydium close position", async () => {
    assert(wallet, "wallet can't be null");

    const { bundleSimulationResponse } = await raydiumClosePosition(
      dex,
      sender,
      owner,
      {
        slippage: 50,
        pair: new PublicKey("3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv"),
        position: new PublicKey("oX5vYqFVJZS549PPGTD3Qoqzq4684XzNjwgvaRydinx"),
        jitoConfig: {
          type: "dynamic",
          priorityFeePercentile: "50ema",
        },
      },
    );

    expect(bundleSimulationResponse.result.value.summary).toBe("succeeded");
    expect(
      bundleSimulationResponse.result.value.transactionResults,
    ).toHaveLength(2);
  });
});
