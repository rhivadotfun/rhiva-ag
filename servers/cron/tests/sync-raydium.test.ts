import bs58 from "bs58";
import type { z } from "zod/mini";
import { eq, inArray } from "drizzle-orm";
import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { getTransferFeeConfig, unpackMint } from "@solana/spl-token";
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
import { syncRaydiumPositionsForWallet } from "../src/controllers/sync/raydium";

describe("sync raydium", () => {
  let db: Database;
  let secret: Secret;
  let raydium: Raydium;
  let connection: Connection;
  let user: z.infer<typeof userInsertSchema> | undefined;

  let tokens: Pick<z.infer<typeof mintSelectSchema>, "id">[] | undefined;
  let pool: Pick<z.infer<typeof poolSelectSchema>, "id"> | undefined;
  let wallet:
    | Pick<z.infer<typeof walletSelectSchema>, "id" | "key">
    | undefined;
  let position: Pick<z.infer<typeof positionSelectSchema>, "id"> | undefined;

  beforeAll(async () => {
    const poolPubkey = "3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv";
    const positionPubkey = "oX5vYqFVJZS549PPGTD3Qoqzq4684XzNjwgvaRydinx";

    connection = new Connection(getEnv("SOLANA_RPC_URL"));
    raydium = await Raydium.load({
      connection,
      disableFeatureCheck: true,
      disableLoadToken: true,
    });

    db = createDB(getEnv("DATABASE_URL"));
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

    const clmm = await raydium.clmm.getRpcClmmPoolInfo({ poolId: poolPubkey });

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

    const poolMints = [clmm.mintA.toBase58(), clmm.mintB.toBase58()];

    const rewardMints = mapFilter(clmm.rewardInfos, (reward) =>
      reward.tokenMint.equals(PublicKey.default)
        ? null
        : reward.tokenMint.toBase58(),
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
          const mint = unpackMint(accountInfo.publicKey, accountInfo);
          const feeConfig = getTransferFeeConfig(mint);
          return {
            id: mint.address.toBase58(),
            decimals: mint.decimals,
            extensions: {
              feeConfig: feeConfig
                ? {
                    transferFeeConfigAuthority:
                      feeConfig.transferFeeConfigAuthority.toBase58(),
                    withdrawWithheldAuthority:
                      feeConfig.withdrawWithheldAuthority.toBase58(),
                    withheldAmount: feeConfig.withheldAmount.toString(),
                    olderTransferFee: {
                      epoch: feeConfig.olderTransferFee.epoch.toString(),
                      maximumFee:
                        feeConfig.olderTransferFee.maximumFee.toString(),
                      transferFeeBasisPoints:
                        feeConfig.olderTransferFee.transferFeeBasisPoints,
                    },
                    newerTransferFee: {
                      epoch: feeConfig.newerTransferFee.epoch.toString(),
                      maximumFee:
                        feeConfig.newerTransferFee.maximumFee.toString(),
                      transferFeeBasisPoints:
                        feeConfig.newerTransferFee.transferFeeBasisPoints,
                    },
                  }
                : undefined,
            },
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
        baseToken: clmm.mintA.toBase58(),
        quoteToken: clmm.mintB.toBase58(),
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

    const results = await syncRaydiumPositionsForWallet(
      db,
      connection,
      coingecko,
      wallet,
    );

    expect(results).toHaveLength(2);
  });
});
