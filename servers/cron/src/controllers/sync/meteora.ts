import { format } from "util";
import Decimal from "decimal.js";
import type { z } from "zod/mini";
import { MintLayout } from "@solana/spl-token";
import { and, eq, inArray, not } from "drizzle-orm";
import type { ProgramEventType } from "@rhiva-ag/decoder";
import { PublicKey, type Connection } from "@solana/web3.js";
import type Coingecko from "@coingecko/coingecko-typescript";
import type { LbClmm } from "@rhiva-ag/decoder/programs/idls/types/meteora";
import DLMM, { createProgram, getPriceOfBinByBinId } from "@meteora-ag/dlmm";
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
  pools,
  rewards,
  positions,
  poolRewardTokens,
  type Database,
  type walletSelectSchema,
  buildConflictUpdateColumns,
} from "@rhiva-ag/datasource";

import { sendNotification } from "../send-notification";

function fromPricePerLamport(
  pricePerLamport: Decimal,
  decimal0: number,
  decimal1: number,
) {
  return new Decimal(pricePerLamport).div(
    new Decimal(10 ** (decimal1 - decimal0)),
  );
}

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
      config: true,
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
  const poolUpdates: {
    id: string;
    update: Partial<typeof pools.$inferInsert>;
  }[] = [];
  const positionUpdates: {
    id: string;
    update: Partial<typeof positions.$inferInsert>;
  }[] = [];

  for (const { lbPair, ...position } of lbPairWithPositions) {
    const activeBin = lbPair.activeId;

    const offchainPosition = positionsMap.get(position.publicKey.toBase58());
    const [reward1Mint, reward2Mint] = lbPair.rewardInfos.map((rewardInfo) =>
      rewardInfo.mint.toBase58(),
    );

    if (!offchainPosition) continue;

    const { pool } = offchainPosition;

    const active =
      activeBin >= position.positionData.lowerBinId &&
      activeBin <= position.positionData.upperBinId;
    const lowerBinPrice = fromPricePerLamport(
      getPriceOfBinByBinId(position.positionData.lowerBinId, lbPair.binStep),
      pool.baseToken.decimals,
      pool.quoteToken.decimals,
    ).toNumber();
    const upperBinPrice = fromPricePerLamport(
      getPriceOfBinByBinId(position.positionData.upperBinId, lbPair.binStep),
      pool.baseToken.decimals,
      pool.quoteToken.decimals,
    ).toNumber();
    const priceRange: [number, number] = [lowerBinPrice, upperBinPrice];

    let rewardUsd = 0,
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

    let reward1Amount = 0,
      reward2Amount = 0;
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

    const priceX = prices[baseToken.id]?.usd;
    const priceY = prices[quoteToken.id]?.usd;

    let baseAmountUsd = 0,
      quoteAmountUsd = 0,
      baseFeeUsd = 0,
      quoteFeeUsd = 0;

    if (priceX) {
      baseFeeUsd += priceX * feeX;
      baseAmountUsd += priceX * amountX;
      claimedFeeUsd += priceX * claimedFeeX;
    }

    if (priceY) {
      quoteFeeUsd += priceY * feeY;
      quoteAmountUsd += priceY * amountY;
      claimedFeeUsd += priceY * claimedFeeY;
    }

    if (reward1Token) {
      const priceReward1 = prices[reward1Token.mint.id];
      reward1Amount = new Decimal(rawReward1Amount)
        .div(Math.pow(10, reward1Token.mint.decimals))
        .toNumber();

      if (priceReward1) rewardUsd += priceReward1.usd * reward1Amount;
    }

    if (reward2Token) {
      const priceReward2 = prices[reward2Token.mint.id];
      reward2Amount = new Decimal(rawReward2Amount)
        .div(Math.pow(10, reward2Token.mint.decimals))
        .toNumber();

      if (priceReward2) rewardUsd += priceReward2.usd * reward2Amount;
    }

    const feeUsd = baseFeeUsd + quoteFeeUsd;
    const amountUsd = baseAmountUsd + quoteAmountUsd;
    const tvl = offchainPosition.amountUsd;
    const totalTVL = amountUsd + feeUsd + rewardUsd;
    const pnlUsd = totalTVL - tvl;

    const currentPrice = fromPricePerLamport(
      getPriceOfBinByBinId(lbPair.activeId, lbPair.binStep),
      pool.baseToken.decimals,
      pool.quoteToken.decimals,
    ).toNumber();
    console.log(currentPrice, lbPair.activeId, pnlUpdates, { depth: null });
    positionUpdates.push({
      id: offchainPosition.id,
      update: { active, config: { ...offchainPosition.config, priceRange } },
    });
    poolUpdates.push({
      id: offchainPosition.pool.id,
      update: {
        config: {
          ...offchainPosition.pool.config,
          extra: {
            currentPrice,
            binId: lbPair.activeId,
          },
        },
      },
    });
    pnlUpdates.push({
      feeUsd,
      pnlUsd,
      rewardUsd,
      amountUsd,
      claimedFeeUsd,
      state: "opened",
      baseAmountUsd,
      quoteAmountUsd,
      baseAmount: amountX,
      quoteAmount: amountY,
      unclaimedBaseFee: feeX,
      unclaimedQuoteFee: feeY,
      unclaimedBaseFeeUsd: baseFeeUsd,
      unclaimedQuoteFeeUsd: quoteFeeUsd,
      position: offchainPosition.id,
    });
  }

  const result = await Promise.all([
    db
      .insert(pnls)
      .values(pnlUpdates)
      .onConflictDoUpdate({
        target: [pnls.position, pnls.createdAt],
        set: buildConflictUpdateColumns(pnls, [
          "state",
          "feeUsd",
          "pnlUsd",
          "rewardUsd",
          "amountUsd",
          "baseAmount",
          "quoteAmount",
          "claimedFeeUsd",
          "baseAmountUsd",
          "quoteAmountUsd",
          "unclaimedBaseFee",
          "unclaimedQuoteFee",
          "unclaimedBaseFeeUsd",
          "unclaimedQuoteFeeUsd",
        ]),
      })
      .returning(),
    ...poolUpdates.map(({ id, update }) =>
      db.update(pools).set(update).where(eq(pools.id, id)).returning(),
    ),
    ...positionUpdates.map(({ id, update }) =>
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
          symbol: true,
          decimals: true,
        },
      },
      quoteToken: {
        columns: {
          id: true,
          symbol: true,
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
                symbol: true,
                decimals: true,
              },
            },
            quoteToken: {
              columns: {
                id: true,
                symbol: true,
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
  events,
  wallet,
  type,
  extra: { signature },
}: {
  db: Database;
  coingecko: Coingecko;
  connection: Connection;
  extra: { signature: string };
  events: ProgramEventType<LbClmm>[];
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id" | "user">;
  type?: "closed-position" | "create-position" | "claim-reward";
}) => {
  const results = [];
  let newPosition = type === "create-position";
  const closedPosition =
    type === "closed-position" ||
    events.find(({ name }) => name === "positionClose");

  for (const event of events) {
    if (event.name === "positionCreate") newPosition = true;
    else if (newPosition && event.name === "addLiquidity") {
      const data = event.data;
      const positionId = data.position.toBase58();
      const pool = await upsertPool(db, connection, data.lbPair.toBase58());

      if (pool) {
        const [rawAmountX, rawAmountY] = data.amounts;
        let amountUsd = 0;

        const price = (await coingecko.simple.tokenPrice.getID("solana", {
          vs_currencies: "usd",
          contract_addresses: [pool.baseToken.id, pool.quoteToken.id].join(","),
        })) as Record<string, { usd: number }>;

        const baseTokenPrice = price[pool.baseToken.id]?.usd;
        const quoteTokenPrice = price[pool.quoteToken.id]?.usd;

        let baseAmount = 0,
          quoteAmount = 0;

        if (rawAmountX) {
          baseAmount = new Decimal(rawAmountX.toString())
            .div(Math.pow(10, pool.baseToken.decimals))
            .toNumber();
          if (baseTokenPrice) amountUsd += baseTokenPrice * baseAmount;
        }

        if (rawAmountY) {
          quoteAmount = new Decimal(rawAmountY.toString())
            .div(Math.pow(10, pool.quoteToken.decimals))
            .toNumber();
          if (quoteTokenPrice) amountUsd += quoteTokenPrice * quoteAmount;
        }

        const values: typeof positions.$inferInsert = {
          amountUsd,
          pool: pool.id,
          id: positionId,
          state: "open",
          status: "successful",
          active: true,
          wallet: wallet.id,
          config: {
            history: {
              openPrice: {
                baseToken: baseTokenPrice,
                quoteToken: quoteTokenPrice,
              },
            },
          },
        };

        const [updatedPosition] = await Promise.all([
          db
            .insert(positions)
            .values(values)
            .onConflictDoNothing({ target: [positions.id] })
            .returning(),
          db.insert(rewards).values({
            key: "swap",
            user: wallet.user,
            xp: Math.floor(amountUsd),
          }),
          sendNotification(db, {
            user: wallet.user,
            type: "transactions",
            title: { external: true, text: "position.created" },
            detail: {
              external: true,
              text: "position.created",
              params: {
                signature,
                position: positionId,
                baseToken: {
                  amount: baseAmount,
                  price: baseTokenPrice,
                  symbol: pool.baseToken.symbol,
                },
                quoteToken: {
                  amount: quoteAmount,
                  price: quoteTokenPrice,
                  symbol: pool.quoteToken.symbol,
                },
              },
            },
          }),
        ]);

        results.push(updatedPosition);
      }
    } else if (closedPosition && event.name === "removeLiquidity") {
      const data = event.data;
      const positionId = data.position.toBase58();
      const position = await getPositionById(db, positionId);

      if (!position) return;

      const { pool } = position;
      const price = (await coingecko.simple.tokenPrice.getID("solana", {
        vs_currencies: "usd",
        contract_addresses: [pool.baseToken.id, pool.quoteToken.id].join(","),
      })) as Record<string, { usd: number }>;

      const baseTokenPrice = price[pool.baseToken.id]?.usd;
      const quoteTokenPrice = price[pool.quoteToken.id]?.usd;

      const [rawBaseAmount, rawQuoteAmount] = data.amounts;
      let baseAmount = 0,
        quoteAmount = 0;
      if (rawBaseAmount)
        baseAmount = new Decimal(rawBaseAmount.toString())
          .div(Math.pow(10, pool.baseToken.decimals))
          .toNumber();
      if (rawQuoteAmount)
        quoteAmount = new Decimal(rawQuoteAmount.toString())
          .div(Math.pow(10, pool.quoteToken.decimals))
          .toNumber();

      const [updatedPosition] = await Promise.all([
        db
          .update(positions)
          .set({
            state: "closed",
            config: {
              ...positions.config,
              history: {
                ...position.config.history,
                closingPrice: {
                  baseToken: baseTokenPrice,
                  quoteToken: quoteTokenPrice,
                },
              },
            },
          })
          .where(eq(positions.id, positionId))
          .returning(),
        sendNotification(db, {
          user: wallet.user,
          type: "transactions",
          title: { external: true, text: "position.closed" },
          detail: {
            external: true,
            text: "position.closed",
            params: {
              signature,
              position: positionId,
              baseToken: {
                amount: baseAmount,
                price: baseTokenPrice,
                symbol: pool.baseToken.symbol,
              },
              quoteToken: {
                amount: quoteAmount,
                price: quoteTokenPrice,
                symbol: pool.quoteToken.symbol,
              },
            },
          },
        }),
      ]);

      results.push(updatedPosition);
    }
  }

  return results;
};
