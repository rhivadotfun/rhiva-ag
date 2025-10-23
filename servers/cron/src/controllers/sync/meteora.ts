import { format } from "util";
import type { z } from "zod/mini";
import Decimal from "decimal.js";
import { MintLayout } from "@solana/spl-token";
import { and, eq, inArray, not } from "drizzle-orm";
import DLMM, { createProgram } from "@meteora-ag/dlmm";
import type { ProgramEventType } from "@rhiva-ag/decoder";
import { PublicKey, type Connection } from "@solana/web3.js";
import type Coingecko from "@coingecko/coingecko-typescript";
import type { LbClmm } from "@rhiva-ag/decoder/programs/idls/types/meteora";
import {
  chunkFetchMultipleAccounts,
  collectionToMap,
  flatMapFilter,
  isNative,
  isTokenProgram,
  mapFilter,
} from "@rhiva-ag/shared";
import {
  mints,
  pnls,
  poolRewardTokens,
  pools,
  positions,
  type Database,
  type walletSelectSchema,
} from "@rhiva-ag/datasource";

export const syncMeteoraPositionsForWallet = async (
  db: Database,
  connection: Connection,
  coingecko: Coingecko,
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id" | "key">,
) => {
  const walletPositions = await db.query.positions.findMany({
    columns: {
      id: true,
      pool: false,
      amountUsd: true,
    },
    with: {
      pool: {
        columns: {
          baseToken: false,
          quoteToken: false,
          rewardTokens: false,
        },
        with: {
          baseToken: true,
          quoteToken: true,
          rewardTokens: {
            columns: {
              mint: false,
            },
            with: {
              mint: {
                columns: {
                  id: true,
                  decimals: true,
                },
              },
            },
          },
        },
      },
    },
    where: and(
      eq(positions.wallet, wallet.id),
      not(inArray(positions.state, ["closed", "idle"])),
    ),
  });

  const positionsMap = collectionToMap(
    walletPositions,
    (position) => position.id,
  );

  if (walletPositions.length < 1) return;

  const positionsV2 = await DLMM.getAllLbPairPositionsByUser(
    connection,
    new PublicKey(wallet.id),
  );

  const mints = new Set();

  const lbPairWithPositions = flatMapFilter(
    positionsV2.values().toArray(),
    ({ lbPair, lbPairPositionsData, publicKey }) => {
      mints.add(lbPair.tokenXMint.toBase58());
      mints.add(lbPair.tokenYMint.toBase58());
      for (const rewardInfo of lbPair.rewardInfos)
        if (!PublicKey.default.equals(rewardInfo.mint))
          mints.add(rewardInfo.mint.toBase58());

      return lbPairPositionsData.map((lbPairPositionsData) => ({
        ...lbPairPositionsData,
        lbPair: { publicKey, ...lbPair },
      }));
    },
  );

  const prices = (await coingecko.simple.tokenPrice.getID("solana", {
    vs_currencies: "usd",
    contract_addresses: Array.from(mints).join(","),
  })) as Record<string, { usd: number }>;

  const pnlUpdates: (typeof pnls.$inferInsert)[] = [];
  const positionUpdates: { id: string; update: { active: boolean } }[] = [];

  for (const { lbPair, ...position } of lbPairWithPositions) {
    const activeBin = lbPair.activeId;

    const offchainPosition = positionsMap.get(position.publicKey.toBase58());
    const [reward1Mint, reward2Mint] = lbPair.rewardInfos.map((rewardInfo) =>
      rewardInfo.mint.toBase58(),
    );

    if (!offchainPosition) continue;

    const active =
      activeBin >= position.positionData.lowerBinId &&
      activeBin <= position.positionData.upperBinId;

    let feeUsd = 0,
      amountUsd = 0,
      rewardUsd = 0,
      claimedFeeUsd = 0;

    const { baseToken, quoteToken } = offchainPosition.pool;
    const reward1Token = offchainPosition.pool.rewardTokens.find(
      ({ mint }) => mint.id === reward1Mint,
    );
    const reward2Token = offchainPosition.pool.rewardTokens.find(
      ({ mint }) => mint.id === reward2Mint,
    );

    const rawFeeX = position.positionData.feeXExcludeTransferFee.toString();
    const rawFeeY = position.positionData.feeYExcludeTransferFee.toString();
    const rawAmountX =
      position.positionData.totalXAmountExcludeTransferFee.toString();
    const rawAmountY =
      position.positionData.totalYAmountExcludeTransferFee.toString();
    const rawReward1Amount =
      position.positionData.rewardOneExcludeTransferFee.toString();
    const rawReward2Amount =
      position.positionData.rewardTwoExcludeTransferFee.toString();

    const rawClaimedFeeX =
      position.positionData.totalClaimedFeeXAmount.toString();
    const rawClaimedFeeY =
      position.positionData.totalClaimedFeeYAmount.toString();

    const feeX = new Decimal(rawFeeX)
      .div(Math.pow(10, baseToken.decimals))
      .toNumber();
    const feeY = new Decimal(rawFeeY)
      .div(Math.pow(10, quoteToken.decimals))
      .toNumber();
    const amountX = new Decimal(rawAmountX)
      .div(Math.pow(10, baseToken.decimals))
      .toNumber();
    const amountY = new Decimal(rawAmountY)
      .div(Math.pow(10, quoteToken.decimals))
      .toNumber();
    const claimedFeeX = new Decimal(rawClaimedFeeX)
      .div(Math.pow(10, baseToken.decimals))
      .toNumber();
    const claimedFeeY = new Decimal(rawClaimedFeeY)
      .div(Math.pow(10, quoteToken.decimals))
      .toNumber();

    const priceX = prices[baseToken.id];
    const priceY = prices[quoteToken.id];

    if (priceX) {
      feeUsd += priceX.usd * feeX;
      amountUsd += priceX.usd * amountX;
      claimedFeeUsd += priceX.usd * claimedFeeX;
    }

    if (priceY) {
      feeUsd += priceY.usd * feeY;
      amountUsd += priceY.usd * amountY;
      claimedFeeUsd += priceY.usd * claimedFeeY;
    }

    if (reward1Token) {
      const priceReward1 = prices[reward1Token.mint.id];

      const reward1Amount = new Decimal(rawReward1Amount)
        .div(Math.pow(10, reward1Token.mint.decimals))
        .toNumber();

      if (priceReward1) rewardUsd += priceReward1.usd * reward1Amount;
    }

    if (reward2Token) {
      const priceReward2 = prices[reward2Token.mint.id];

      const reward2Amount = new Decimal(rawReward2Amount)
        .div(Math.pow(10, reward2Token.mint.decimals))
        .toNumber();

      if (priceReward2) rewardUsd += priceReward2.usd * reward2Amount;
    }

    const tvl = offchainPosition.amountUsd;
    const totalTVL = amountUsd + feeUsd + rewardUsd;
    const pnlUsd = totalTVL - tvl;

    positionUpdates.push({ id: offchainPosition.id, update: { active } });
    pnlUpdates.push({
      feeUsd,
      pnlUsd,
      rewardUsd,
      amountUsd,
      state: "opened",
      claimedFeeUsd,
      position: offchainPosition.id,
    });
  }

  const result = await Promise.all([
    db
      .insert(pnls)
      .values(pnlUpdates)
      .onConflictDoUpdate({
        target: [pnls.position, pnls.createdAt],
        set: {
          state: pnls.state,
          pnlUsd: pnls.pnlUsd,
          feeUsd: pnls.feeUsd,
          rewardUsd: pnls.rewardUsd,
          amountUsd: pnls.amountUsd,
        },
      })
      .returning(),
    ...positionUpdates.flatMap(({ id, update }) =>
      db.update(positions).set(update).where(eq(positions.id, id)).returning(),
    ),
  ]);

  return result.flat(2);
};

const getPoolById = async (
  db: Database,
  id: (typeof pools.$inferSelect)["id"],
) =>
  await db.query.pools.findFirst({
    columns: {
      baseToken: false,
      quoteToken: false,
    },
    with: {
      baseToken: {
        columns: {
          id: true,
          decimals: true,
        },
      },
      quoteToken: {
        columns: {
          id: true,
          decimals: true,
        },
      },
    },
    where: eq(pools.id, id),
  });

const getPositionById = async (
  db: Database,
  id: (typeof pools.$inferSelect)["id"],
) =>
  await db.query.positions
    .findFirst({
      columns: {
        pool: false,
      },
      with: {
        pool: {
          columns: {
            baseToken: false,
            quoteToken: false,
          },
          with: {
            baseToken: {
              columns: {
                id: true,
                decimals: true,
              },
            },
            quoteToken: {
              columns: {
                id: true,
                decimals: true,
              },
            },
          },
        },
      },
      where: eq(positions.id, id),
    })
    .execute();

async function upsertPool(
  db: Database,
  connection: Connection,
  poolId: string,
) {
  const pool = await getPoolById(db, poolId);

  if (pool) return pool;
  const program = createProgram(connection);
  const pair = await program.account.lbPair.fetch(poolId);

  if (pair) {
    const rewardPubkeys = mapFilter(pair.rewardInfos, (reward) =>
      PublicKey.default.equals(reward.mint) ? null : reward.mint,
    );
    const mintPubkeys = [pair.tokenXMint, pair.tokenYMint, ...rewardPubkeys];

    const mintAccountInfos = await chunkFetchMultipleAccounts(
      mintPubkeys,
      connection.getMultipleAccountsInfo.bind(connection),
    );
    const mintValues = mapFilter(mintAccountInfos, (mintAccountInfo) => {
      if (mintAccountInfo) {
        if (isNative(mintAccountInfo.owner))
          return {
            decimals: 9,
            id: mintAccountInfo.publicKey.toBase58(),
            tokenProgram: mintAccountInfo.owner.toBase58(),
          };
        else if (isTokenProgram(mintAccountInfo.owner)) {
          const account = MintLayout.decode(mintAccountInfo.data);
          return {
            decimals: account.decimals,
            id: mintAccountInfo.publicKey.toBase58(),
            tokenProgram: mintAccountInfo.owner.toBase58(),
          };
        }
      }
    });

    if (mintValues.length > 0)
      await db.insert(mints).values(mintValues).onConflictDoNothing().execute();

    await db.insert(pools).values({
      id: poolId,
      dex: "meteora",
      config: {},
      baseToken: pair.tokenXMint.toBase58(),
      quoteToken: pair.tokenYMint.toBase58(),
      rewardTokens: rewardPubkeys.map((pubkey) => pubkey.toBase58()),
    });

    await db.insert(poolRewardTokens).values(
      rewardPubkeys.map((pubkey) => ({
        pool: poolId,
        mint: pubkey.toBase58(),
      })),
    );

    return getPoolById(db, poolId);
  }

  throw new Error(format("pool with id=% not found", poolId));
}

export const syncMeteoraPositionStateFromEvent = async ({
  db,
  coingecko,
  connection,
  type,
  events,
  wallet,
}: {
  db: Database;
  coingecko: Coingecko;
  connection: Connection;
  extra?: { signature: string };
  events: ProgramEventType<LbClmm>[];
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id">;
  type?: "closed-position" | "create-position" | "claim-reward";
}) => {
  const results = [];

  for (const event of events) {
    if (event.name === "positionCreate") {
      const data = event.data;
      const pool = await upsertPool(db, connection, data.lbPair.toBase58());

      if (pool) {
        const [position] = await db
          .insert(positions)
          .values({
            config: {},
            active: true,
            state: "open",
            pool: pool.id,
            amountUsd: 0,
            baseAmount: 0,
            quoteAmount: 0,
            wallet: wallet.id,
            status: "pending",
            id: data.position.toBase58(),
          })
          .onConflictDoNothing({
            target: [positions.id],
          })
          .returning();

        results.push(position);
      }
    } else if (event.name === "addLiquidity") {
      const data = event.data;
      const positionId = data.position.toBase58();
      const position = await getPositionById(db, positionId);

      if (position) {
        const { pool } = position;
        const [rawAmountX, rawAmountY] = data.amounts;
        let baseAmount = position.baseAmount,
          quoteAmount = position.quoteAmount,
          amountUsd = position.amountUsd;

        const price = (await coingecko.simple.tokenPrice.getID("solana", {
          vs_currencies: "usd",
          contract_addresses: [pool.baseToken.id, pool.quoteToken.id].join(","),
        })) as Record<string, { usd: number }>;

        if (rawAmountX) {
          const priceUsd = price[pool.baseToken.id];
          const amount = new Decimal(rawAmountX.toString())
            .div(Math.pow(10, pool.baseToken.decimals))
            .toNumber();
          baseAmount += amount;
          if (priceUsd) amountUsd += priceUsd.usd * amount;
        }

        if (rawAmountY) {
          const priceUsd = price[pool.quoteToken.id];
          const amount = new Decimal(rawAmountY.toString())
            .div(Math.pow(10, pool.quoteToken.decimals))
            .toNumber();
          quoteAmount += amount;
          if (priceUsd) amountUsd += priceUsd.usd * amount;
        }

        const values: Partial<typeof positions.$inferInsert> = {
          baseAmount,
          quoteAmount,
          amountUsd,
          active: true,
          status: "successful",
        };

        const [updatedPosition] = await db
          .update(positions)
          .set(values)
          .where(eq(positions.id, position.id))
          .returning();

        results.push(updatedPosition);
      }
    } else if (event.name === "removeLiquidity") {
      if (type === "closed-position") continue;

      const data = event.data;
      const positionId = data.position.toBase58();

      const position = await getPositionById(db, positionId);

      if (position) {
        const { pool } = position;
        const [rawAmountX, rawAmountY] = data.amounts;
        let baseAmount = position.baseAmount,
          quoteAmount = position.quoteAmount,
          amountUsd = position.amountUsd;

        const price = (await coingecko.simple.tokenPrice.getID("solana", {
          vs_currencies: "usd",
          contract_addresses: [pool.baseToken.id, pool.quoteToken.id].join(","),
        })) as Record<string, { usd: number }>;

        if (rawAmountX) {
          const priceUsd = price[pool.baseToken.id];
          const amount = new Decimal(rawAmountX.toString())
            .div(Math.pow(10, pool.baseToken.decimals))
            .toNumber();

          baseAmount -= amount;
          if (priceUsd) amountUsd -= priceUsd.usd * amount;
        }

        if (rawAmountY) {
          const priceUsd = price[pool.quoteToken.id];
          const amount = new Decimal(rawAmountY.toString())
            .div(Math.pow(10, pool.quoteToken.decimals))
            .toNumber();

          quoteAmount -= amount;
          if (priceUsd) amountUsd -= priceUsd.usd * amount;
        }

        const [updatedPosition] = await db
          .update(positions)
          .set({
            baseAmount,
            quoteAmount,
            amountUsd,
          })
          .where(eq(positions.id, positionId))
          .returning();

        results.push(updatedPosition);
      }
    } else if (event.name === "positionClose") {
      const data = event.data;
      const positionId = data.position.toBase58();

      const [position] = await db
        .update(positions)
        .set({
          state: "closed",
        })
        .where(eq(positions.id, positionId))
        .returning();

      results.push(position);
    }
  }

  return results;
};
