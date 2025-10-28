import BN from "bn.js";
import moment from "moment";
import { format } from "util";
import type { z } from "zod/mini";
import Decimal from "decimal.js";
import { RaydiumCLMM } from "@rhiva-ag/dex";
import { MintLayout } from "@solana/spl-token";
import { and, eq, inArray, not } from "drizzle-orm";
import type { ProgramEventType } from "@rhiva-ag/decoder";
import { PublicKey, type Connection } from "@solana/web3.js";
import type Coingecko from "@coingecko/coingecko-typescript";
import type { AmmV3 } from "@rhiva-ag/decoder/programs/idls/types/raydium";
import {
  chunkFetchMultipleAccounts,
  collectionToMap,
  isNative,
  isTokenProgram,
  mapFilter,
} from "@rhiva-ag/shared";
import {
  PoolInfoLayout,
  Raydium,
  PositionUtils,
  TickUtils,
  SqrtPriceMath,
  CLMM_PROGRAM_ID,
  TickArrayLayout,
  PositionInfoLayout,
  getPdaPersonalPositionAddress,
} from "@raydium-io/raydium-sdk-v2";
import {
  rewards,
  mints,
  pnls,
  poolRewardTokens,
  pools,
  positions,
  type Database,
  type walletSelectSchema,
  buildConflictUpdateColumns,
} from "@rhiva-ag/datasource";

import { sendNotification } from "../send-notification";

export const syncRaydiumPositionsForWallet = async (
  db: Database,
  connection: Connection,
  coingecko: Coingecko,
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id" | "key">,
) => {
  const raydium = await Raydium.load({
    connection,
    owner: new PublicKey(wallet.id),
    disableLoadToken: true,
    disableFeatureCheck: true,
  });
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
  const clmmPositions = await chunkFetchMultipleAccounts(
    walletPositions.map(
      (position) =>
        getPdaPersonalPositionAddress(
          CLMM_PROGRAM_ID,
          new PublicKey(position.id),
        ).publicKey,
    ),
    connection.getMultipleAccountsInfo.bind(connection),
    (account) => PositionInfoLayout.decode(account.data),
  );
  const poolIds = new Set(
    clmmPositions.map((position) => position.poolId.toBase58()),
  );
  const poolAccounts = await chunkFetchMultipleAccounts(
    poolIds
      .values()
      .map((poolId) => new PublicKey(poolId))
      .toArray(),
    connection.getMultipleAccountsInfo.bind(connection),
    (account) => PoolInfoLayout.decode(account.data),
  );

  const poolAccountsMap = collectionToMap(poolAccounts, (account) =>
    account.publicKey.toBase58(),
  );

  const mints = new Set();
  const tickArrayAddresses: PublicKey[] = [];

  const clmmPositionsWithTickAddress = mapFilter(clmmPositions, (position) => {
    const pool = poolAccountsMap.get(position.poolId.toBase58());
    const ticks = [position.tickLower, position.tickUpper];
    if (!pool) return;

    const [lowerTickArrayAddress, upperTickArrayAddress] = ticks.map((tick) =>
      TickUtils.getTickArrayAddressByTick(
        CLMM_PROGRAM_ID,
        position.poolId,
        tick,
        pool.tickSpacing,
      ),
    ) as [PublicKey, PublicKey];

    tickArrayAddresses.push(lowerTickArrayAddress, upperTickArrayAddress);

    mints.add(pool.mintA.toBase58());
    mints.add(pool.mintB.toBase58());
    for (const rewardInfo of pool.rewardInfos)
      mints.add(rewardInfo.tokenMint.toBase58());

    return {
      lowerTickArrayAddress,
      upperTickArrayAddress,
      pool,
      ...position,
    };
  });

  if (clmmPositionsWithTickAddress.length < 1) return;

  const tickArraysMap = collectionToMap(
    await chunkFetchMultipleAccounts(
      tickArrayAddresses,
      connection.getMultipleAccountsInfo.bind(connection),
      (account) => TickArrayLayout.decode(account.data),
    ),
    (tickArray) => tickArray.publicKey.toBase58(),
  );

  const prices = (await coingecko.simple.tokenPrice.getID("solana", {
    vs_currencies: "usd",
    contract_addresses: Array.from(mints).join(","),
  })) as Record<string, { usd: number }>;

  const epochInfo = await raydium.fetchEpochInfo();

  const pnlUpdates: (typeof pnls.$inferInsert)[] = [];
  const poolUpdates: {
    id: string;
    update: Partial<typeof pools.$inferInsert>;
  }[] = [];
  const positionUpdates: {
    id: string;
    update: Partial<typeof positions.$inferInsert>;
  }[] = [];

  for (const { pool, ...position } of clmmPositionsWithTickAddress) {
    const lowerTickArray = tickArraysMap.get(
      position.lowerTickArrayAddress.toBase58(),
    );
    const upperTickArray = tickArraysMap.get(
      position.upperTickArrayAddress.toBase58(),
    );
    const offchainPosition = positionsMap.get(position.nftMint.toBase58());

    if (!offchainPosition || !lowerTickArray || !upperTickArray) continue;
    const lowerTickState =
      lowerTickArray.ticks[
        TickUtils.getTickOffsetInArray(position.tickLower, pool.tickSpacing)
      ];
    const upperTickState =
      upperTickArray.ticks[
        TickUtils.getTickOffsetInArray(position.tickUpper, pool.tickSpacing)
      ];
    const active =
      pool.tickCurrent >= position.tickLower &&
      pool.tickCurrent <= position.tickUpper;
    const lowerTickPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      SqrtPriceMath.getSqrtPriceX64FromTick(position.tickLower),
      offchainPosition.pool.baseToken.decimals,
      offchainPosition.pool.quoteToken.decimals,
    ).toNumber();

    const upperTickPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      SqrtPriceMath.getSqrtPriceX64FromTick(position.tickUpper),
      offchainPosition.pool.baseToken.decimals,
      offchainPosition.pool.quoteToken.decimals,
    ).toNumber();

    const priceRange: [number, number] = [lowerTickPrice, upperTickPrice];

    let rewardUsd = 0,
      baseAmountUsd = 0,
      quoteAmountUsd = 0,
      baseFeeUsd = 0,
      quoteFeeUsd = 0;

    const baseToken = offchainPosition.pool.baseToken;
    const quoteToken = offchainPosition.pool.quoteToken;
    const [rewardToken] = offchainPosition.pool.rewardTokens;

    const { amountA, amountB } = RaydiumCLMM.getAmountsFromLiquidity({
      epochInfo,
      add: false,
      poolInfo: pool,
      ownerPosition: position,
      liquidity: position.liquidity,
      mintA: { extensions: { feeConfig: baseToken.extensions?.feeConfig } },
      mintB: { extensions: { feeConfig: quoteToken.extensions?.feeConfig } },
    });

    const { tokenFeeAmountA, tokenFeeAmountB } =
      PositionUtils.GetPositionFeesV2(
        pool,
        position,
        lowerTickState!,
        upperTickState!,
      );

    const rewardAmounts = PositionUtils.GetPositionRewardsV2(
      pool,
      position,
      lowerTickState!,
      upperTickState!,
    );

    const rawFeeX = tokenFeeAmountA.toString();
    const rawFeeY = tokenFeeAmountB.toString();
    const rawAmountX = amountA.amount.toString();
    const rawAmountY = amountB.amount.toString();

    const rawRewardAmount = rewardAmounts
      .reduce((acc, curr) => acc.add(curr), new BN(0))
      .toString();

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

    const priceX = prices[baseToken.id];
    const priceY = prices[quoteToken.id];

    if (priceX) {
      baseFeeUsd += priceX.usd * feeX;
      baseAmountUsd += priceX.usd * amountX;
    }

    if (priceY) {
      quoteFeeUsd += priceY.usd * feeY;
      quoteAmountUsd += priceY.usd * amountY;
    }

    if (rewardToken) {
      const rewardAmount = new Decimal(rawRewardAmount)
        .div(Math.pow(10, rewardToken.mint.decimals))
        .toNumber();

      const priceReward = prices[rewardToken.mint.id];
      if (priceReward) rewardUsd += priceReward.usd * rewardAmount;
    }

    const feeUsd = baseFeeUsd + quoteFeeUsd;
    const amountUsd = baseAmountUsd + quoteAmountUsd;
    const tvl = offchainPosition.amountUsd;
    const totalTVL = amountUsd + feeUsd + rewardUsd;
    const pnlUsd = tvl - totalTVL;

    const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      SqrtPriceMath.getSqrtPriceX64FromTick(pool.tickCurrent),
      offchainPosition.pool.baseToken.decimals,
      offchainPosition.pool.quoteToken.decimals,
    ).toNumber();

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
            binId: pool.tickCurrent,
          },
        },
      },
    });
    pnlUpdates.push({
      feeUsd,
      pnlUsd,
      rewardUsd,
      amountUsd,
      claimedFeeUsd: 0,
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
  const accountInfo = await connection.getAccountInfo(new PublicKey(poolId));
  if (accountInfo) {
    const pair = PoolInfoLayout.decode(accountInfo.data);
    const rewardPubkeys = mapFilter(pair.rewardInfos, (reward) =>
      PublicKey.default.equals(reward.tokenMint) ? null : reward.tokenMint,
    );
    const mintPubkeys = [pair.mintA, pair.mintB, ...rewardPubkeys];

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
      dex: "raydium-clmm",
      config: {},
      baseToken: pair.mintA.toBase58(),
      quoteToken: pair.mintB.toString(),
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

  throw new Error(format("pool with id=%s not found.", poolId));
}

export const syncRaydiumPositionStateFromEvent = async ({
  db,
  coingecko,
  connection,
  type,
  events,
  wallet,
  positionNftMint: positionId,
  extra: { signature },
}: {
  db: Database;
  connection: Connection;
  coingecko: Coingecko;
  extra: { signature: string };
  events: ProgramEventType<AmmV3>[];
  positionNftMint: string | undefined;
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id" | "user">;
  type?: "closed-position" | "create-position" | "claim-reward";
}) => {
  const results = [];

  for (const event of events) {
    if (event.name === "createPersonalPositionEvent") {
      const data = event.data;
      const pool = await upsertPool(db, connection, data.poolState.toBase58());

      if (pool && positionId) {
        let amountUsd = 0;
        const rawAmountX = data.depositAmount0,
          rawAmountY = data.depositAmount1;
        const price = (await coingecko.simple.tokenPrice.getID("solana", {
          vs_currencies: "usd",
          contract_addresses: [pool.baseToken.id, pool.quoteToken.id].join(","),
        })) as Record<string, { usd: number }>;

        const baseTokenPrice = price[pool.baseToken.id]?.usd;
        const quoteTokenPrice = price[pool.quoteToken.id]?.usd;

        if (rawAmountX) {
          const amount = new Decimal(rawAmountX.toString())
            .div(Math.pow(10, pool.baseToken.decimals))
            .toNumber();

          if (baseTokenPrice) amountUsd -= baseTokenPrice * amount;
        }

        if (rawAmountY) {
          const amount = new Decimal(rawAmountY.toString())
            .div(Math.pow(10, pool.quoteToken.decimals))
            .toNumber();

          if (quoteTokenPrice) amountUsd -= quoteTokenPrice * amount;
        }

        const values: typeof positions.$inferInsert = {
          amountUsd,
          active: true,
          pool: pool.id,
          state: "open",
          wallet: wallet.id,
          status: "successful",
          id: positionId,
          config: {
            history: {
              openPrice: {
                baseToken: baseTokenPrice,
                quoteToken: quoteTokenPrice,
              },
            },
          },
        };

        const [position] = await Promise.all([
          db
            .insert(positions)
            .values(values)
            .onConflictDoNothing({
              target: [positions.id],
            })
            .returning(),
          db.insert(rewards).values({
            user: wallet.user,
            key: "swap",
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
                baseToken: { symbol: pool.baseToken.symbol },
                quoteToken: { symbol: pool.quoteToken.symbol },
              },
            },
          }),
        ]);

        results.push(position);
      }
    } else if (
      event.name === "decreaseLiquidityEvent" &&
      type === "closed-position"
    ) {
      const data = event.data;
      const positionId = data.positionNftMint.toBase58();
      const position = await getPositionById(db, positionId);

      if (!position) return;

      const { pool } = position;
      const price = (await coingecko.simple.tokenPrice.getID("solana", {
        vs_currencies: "usd",
        contract_addresses: [pool.baseToken.id, pool.quoteToken.id].join(","),
      })) as Record<string, { usd: number }>;

      const baseTokenPrice = price[pool.baseToken.id]?.usd;
      const quoteTokenPrice = price[pool.quoteToken.id]?.usd;

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
              duration: moment().diff(moment(position.createdAt)),
              baseToken: { symbol: position.pool.baseToken.symbol },
              quoteToken: { symbol: position.pool.quoteToken.symbol },
            },
          },
        }),
      ]);

      results.push(updatedPosition);
    }
  }

  return results;
};
