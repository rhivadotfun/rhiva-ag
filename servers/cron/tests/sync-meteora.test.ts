import bs58 from "bs58";
import type { z } from "zod/mini";
import DLMM from "@meteora-ag/dlmm";
import { eq, inArray } from "drizzle-orm";
import { MintLayout } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { beforeAll, afterAll, describe, test, expect } from "bun:test";
import {
  chunkFetchMultipleAccounts,
  isNative,
  mapFilter,
  Secret,
} from "@rhiva-ag/shared";
import {
  createDB,
  positions,
  type userInsertSchema,
  users,
  type Database,
  wallets,
  pools,
  mints,
  type walletSelectSchema,
  type positionSelectSchema,
  type mintSelectSchema,
  type poolSelectSchema,
  poolRewardTokens,
} from "@rhiva-ag/datasource";

import { getEnv } from "../src/env";
import { coingecko } from "../src/instances";
import { syncMeteoraPositionsForWallet } from "../src/controllers/sync/meteora";

describe("sync meteora", () => {
  let db: Database;
  let secret: Secret;
  let connection: Connection;
  let user: z.infer<typeof userInsertSchema> | undefined;

  let tokens: Pick<z.infer<typeof mintSelectSchema>, "id">[] | undefined;
  let pool: Pick<z.infer<typeof poolSelectSchema>, "id"> | undefined;
  let wallet:
    | Pick<z.infer<typeof walletSelectSchema>, "id" | "key">
    | undefined;
  let position: Pick<z.infer<typeof positionSelectSchema>, "id"> | undefined;

  beforeAll(async () => {
    const poolPubkey = "BGm1tav58oGcsQJehL9WXBFXF7D27vZsKefj4xJKD5Y";
    const positionPubkey = "Bwesuhw9faxknQaFxAEdhPTUW9wn7VsLEXx1hHSEkZot";

    db = createDB(getEnv("DATABASE_URL"));
    connection = new Connection(getEnv("SOLANA_RPC_URL"));
    secret = new Secret(getEnv("SECRET_KEY"), {
      ivLength: 32,
      algorithm: "aes-256-gcm",
    });

    position = await db.query.positions.findFirst({
      columns: {
        id: true,
      },
      where: eq(positions.id, positionPubkey),
    });

    if (position) return;

    const dlmm = await DLMM.create(connection, new PublicKey(poolPubkey));

    [user] = await db
      .insert(users)
      .values({
        uid: crypto.randomUUID(),
      })
      .returning();

    const keypair = Keypair.fromSecretKey(
      bs58.decode(getEnv<string>("DEV_WALLET")),
    );

    [wallet] = await db
      .insert(wallets)
      .values({
        id: keypair.publicKey.toBase58(),
        key: secret.encrypt(keypair.secretKey.toBase64()),
        user: user!.id!,
      })
      .returning();

    const poolMints = [
      dlmm.tokenX.mint.address.toBase58(),
      dlmm.tokenY.mint.address.toBase58(),
    ];

    const rewardMints = mapFilter(dlmm.rewards, (reward) =>
      reward?.mint.address.equals(PublicKey.default)
        ? null
        : reward?.mint.address.toBase58(),
    );

    const accountInfos = await chunkFetchMultipleAccounts(
      [...poolMints, ...rewardMints].map((mint) => new PublicKey(mint)),
      connection.getMultipleAccountsInfo.bind(connection),
    );

    tokens = await db
      .insert(mints)
      .values(
        accountInfos.map((accountInfo) => {
          if (isNative(accountInfo.publicKey))
            return {
              decimals: 9,
              id: accountInfo.publicKey.toBase58(),
              tokenProgram: accountInfo.owner.toBase58(),
            };
          const account = MintLayout.decode(accountInfo.data);
          return {
            decimals: account.decimals,
            id: accountInfo.publicKey.toBase58(),
            tokenProgram: accountInfo.owner.toBase58(),
          };
        }),
      )
      .onConflictDoNothing({ target: [mints.id] })
      .returning();

    [pool] = await db
      .insert(pools)
      .values({
        id: poolPubkey,
        config: {},
        dex: "raydium-clmm",
        rewardTokens: rewardMints,
        baseToken: dlmm.tokenX.mint.address.toBase58(),
        quoteToken: dlmm.tokenX.mint.address.toBase58(),
      })
      .returning();

    if (rewardMints.length > 0)
      await db
        .insert(poolRewardTokens)
        .values(rewardMints.map((mint) => ({ pool: pool!.id, mint })))
        .onConflictDoNothing();

    [position] = await db
      .insert(positions)
      .values({
        id: positionPubkey,
        amountUsd: 1.92,
        baseAmount: 0.00999969,
        quoteAmount: 0,
        pool: pool!.id,
        config: {},
        active: true,
        state: "open",
        wallet: wallet!.id,
        status: "successful",
      })
      .returning();
  });

  afterAll(async () => {
    if (position)
      await db.delete(positions).where(eq(positions.id, position.id)).execute();
    if (pool) await db.delete(pools).where(eq(pools.id, pool.id)).execute();
    if (tokens)
      await db
        .delete(mints)
        .where(
          inArray(
            mints.id,
            tokens.map((token) => token.id),
          ),
        )
        .execute();
    if (user) await db.delete(users).where(eq(users.id, user.id!)).execute();
  });

  test("should sync pnl", async () => {
    if (!wallet) return;

    const results = await syncMeteoraPositionsForWallet(
      db,
      connection,
      coingecko,
      wallet,
    );
    console.log(results);
    expect(results).toHaveLength(2);
  });
});
