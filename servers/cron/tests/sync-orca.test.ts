import bs58 from "bs58";
import type { z } from "zod/mini";
import { eq, inArray } from "drizzle-orm";
import { fromLegacyPublicKey } from "@solana/compat";
import { fetchWhirlpool } from "@orca-so/whirlpools-client";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getTransferFeeConfig, unpackMint } from "@solana/spl-token";
import { beforeAll, afterAll, describe, test, expect } from "bun:test";
import {
  address,
  createSolanaRpc,
  type Rpc,
  type SolanaRpcApiMainnet,
} from "@solana/kit";
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
import { syncOrcaPositionsForWallet } from "../src/controllers/sync/orca";

describe("sync orca", () => {
  let db: Database;
  let secret: Secret;
  let connection: Connection;
  let rpc: Rpc<SolanaRpcApiMainnet>;
  let user: z.infer<typeof userInsertSchema> | undefined;

  let tokens: Pick<z.infer<typeof mintSelectSchema>, "id">[] | undefined;
  let pool: Pick<z.infer<typeof poolSelectSchema>, "id"> | undefined;
  let wallet:
    | Pick<z.infer<typeof walletSelectSchema>, "id" | "key">
    | undefined;
  let position: Pick<z.infer<typeof positionSelectSchema>, "id"> | undefined;

  beforeAll(async () => {
    const poolPubkey = address("Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE");
    const positionPubkey = address(
      "F8u8KJnsbPaYs8cDkN6S8MyDteHqJHktspV9w8K4zFTB",
    );

    connection = new Connection(getEnv<string>("SOLANA_RPC_URL"));
    rpc = createSolanaRpc(connection.rpcEndpoint);

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

    const whirlpool = await fetchWhirlpool(rpc, poolPubkey);

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

    const poolMints = [whirlpool.data.tokenMintA, whirlpool.data.tokenMintB];

    const rewardMints = mapFilter(whirlpool.data.rewardInfos, (reward) =>
      fromLegacyPublicKey(PublicKey.default) === reward.mint
        ? undefined
        : reward.mint,
    );

    const accountInfos = await chunkFetchMultipleAccounts(
      [...poolMints, ...rewardMints].map((mint) => new PublicKey(mint)),
      connection.getMultipleAccountsInfo.bind(connection),
    );

    console.log(poolMints, rewardMints);

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
        baseToken: whirlpool.data.tokenMintA,
        quoteToken: whirlpool.data.tokenMintB,
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

    const results = await syncOrcaPositionsForWallet(
      rpc,
      coingecko,
      db,
      wallet,
    );
    console.log(results, { depth: null });
    expect(results).toHaveLength(2);
  });
});
