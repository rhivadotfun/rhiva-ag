import Decimal from "decimal.js";
import type { z } from "zod/mini";
import { PublicKey } from "@solana/web3.js";
import { and, eq, inArray, not } from "drizzle-orm";
import { fromLegacyPublicKey } from "@solana/compat";
import { getMintDecoder } from "@solana-program/token";
import type { ProgramEventType } from "@rhiva-ag/decoder";
import type Coingecko from "@coingecko/coingecko-typescript";
import type { Whirlpool } from "@rhiva-ag/decoder/programs/idls/types/orca";
import {
  chunkFetchMultipleAccounts,
  collectionToMap,
  isNative,
  isTokenProgram,
  mapFilter,
  promiseMapFilter,
} from "@rhiva-ag/shared";
import {
  getTickIndexInArray,
  decreaseLiquidityQuote,
  collectRewardsQuote,
  getTickArrayStartTickIndex,
} from "@orca-so/whirlpools-core";
import {
  getWhirlpoolDecoder,
  getTickArrayAddress,
  getTickArrayDecoder,
  fetchAllPositionWithFilter,
  positionMintFilter,
  fetchWhirlpool,
} from "@orca-so/whirlpools-client";
import {
  mints,
  pnls,
  poolRewardTokens,
  pools,
  positions,
  type Database,
  type walletSelectSchema,
} from "@rhiva-ag/datasource";
import {
  type Address,
  type GetMultipleAccountsApi,
  type GetTokenAccountsByOwnerApi,
  type GetEpochInfoApi,
  type ProgramDerivedAddress,
  type Rpc,
  type GetProgramAccountsApi,
  address,
  type SolanaRpcApi,
} from "@solana/kit";
import assert from "assert";

export const syncOrcaPositionsForWallet = async (
  rpc: Rpc<
    GetTokenAccountsByOwnerApi &
      GetMultipleAccountsApi &
      GetProgramAccountsApi &
      GetEpochInfoApi
  >,
  coingecko: Coingecko,
  db: Database,
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
                  extensions: true,
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
  const whirlpoolPositions = await fetchAllPositionWithFilter(
    rpc,
    ...walletPositions.map((position) =>
      positionMintFilter(address(position.id)),
    ),
  );

  const whirlpoolIds = new Set(
    whirlpoolPositions.map((position) => position.data.whirlpool),
  );
  const whirpoolCodec = getWhirlpoolDecoder();

  const whirlpoolAccounts = await chunkFetchMultipleAccounts(
    whirlpoolIds.values().toArray(),
    (keys) =>
      rpc
        .getMultipleAccounts(keys)
        .send()
        .then(({ value }) => value),
    (account) => {
      const [data, encoding] = account.data;
      return whirpoolCodec.decode(Buffer.from(data, encoding));
    },
  );

  const whirlpoolAccountsMap = collectionToMap(
    whirlpoolAccounts,
    (account) => account.publicKey,
  );

  const mints = new Set();
  const tickArrayAddresses: Address[] = [];

  const whirlpoolPositionsWithTickAddress = await promiseMapFilter(
    whirlpoolPositions,
    async (position) => {
      const pool = whirlpoolAccountsMap.get(position.data.whirlpool);
      const ticks = [
        position.data.tickLowerIndex,
        position.data.tickUpperIndex,
      ];
      if (!pool) return;

      const [[lowerTickArrayAddress], [upperTickArrayAddress]] =
        (await Promise.all(
          ticks.map((tick) =>
            getTickArrayAddress(
              pool.publicKey,
              getTickArrayStartTickIndex(tick, pool.tickSpacing),
            ),
          ),
        )) as [ProgramDerivedAddress, ProgramDerivedAddress];

      tickArrayAddresses.push(lowerTickArrayAddress, upperTickArrayAddress);

      mints.add(pool.tokenMintA);
      mints.add(pool.tokenMintB);
      for (const rewardInfo of pool.rewardInfos)
        if (fromLegacyPublicKey(PublicKey.default) !== rewardInfo.mint)
          mints.add(rewardInfo.mint);

      return {
        lowerTickArrayAddress,
        upperTickArrayAddress,
        pool,
        ...position,
      };
    },
  );

  if (whirlpoolPositionsWithTickAddress.length < 1) return;

  const tickArrayCodec = getTickArrayDecoder();
  const tickArrays = await chunkFetchMultipleAccounts(
    tickArrayAddresses,
    async (keys) =>
      rpc
        .getMultipleAccounts(keys)
        .send()
        .then(({ value }) => value),
    (account) => {
      const [data, encoding] = account.data;
      return tickArrayCodec.decode(Buffer.from(data, encoding));
    },
  );

  const tickArraysMap = collectionToMap(
    tickArrays,
    (tickArray) => tickArray.publicKey,
  );

  const prices = (await coingecko.simple.tokenPrice.getID("solana", {
    vs_currencies: "usd",
    contract_addresses: Array.from(mints).join(","),
  })) as Record<string, { usd: number }>;

  const pnlUpdates: (typeof pnls.$inferInsert)[] = [];
  const positionUpdates: { id: string; update: { active: boolean } }[] = [];

  const epochInfo = await rpc.getEpochInfo().send();

  for (const { pool, ...position } of whirlpoolPositionsWithTickAddress) {
    const offchainPosition = positionsMap.get(position.data.positionMint);
    const lowerTickArray = tickArraysMap.get(position.lowerTickArrayAddress);
    const upperTickArray = tickArraysMap.get(position.upperTickArrayAddress);

    if (!offchainPosition || !lowerTickArray || !upperTickArray) continue;

    const lowerTickState =
      lowerTickArray.ticks[
        getTickIndexInArray(
          position.data.tickLowerIndex,
          position.data.tickLowerIndex,
          pool.tickSpacing,
        )
      ];
    const upperTickState =
      upperTickArray.ticks[
        getTickIndexInArray(
          position.data.tickUpperIndex,
          position.data.tickUpperIndex,
          pool.tickSpacing,
        )
      ];
    const active =
      pool.tickCurrentIndex >= position.data.tickLowerIndex &&
      pool.tickCurrentIndex <= position.data.tickUpperIndex;

    let feeUsd = 0,
      amountUsd = 0,
      rewardUsd = 0;

    const baseToken = offchainPosition.pool.baseToken;
    const quoteToken = offchainPosition.pool.quoteToken;
    const [rewardToken] = offchainPosition.pool.rewardTokens;
    const baseFee = baseToken.extensions?.feeConfig
      ? {
          feeBps:
            baseToken.extensions.feeConfig.newerTransferFee
              .transferFeeBasisPoints,
          maxFee: BigInt(
            baseToken.extensions.feeConfig.newerTransferFee.maximumFee,
          ),
        }
      : undefined;
    const quoteFee = quoteToken.extensions?.feeConfig
      ? {
          feeBps:
            quoteToken.extensions.feeConfig.newerTransferFee
              .transferFeeBasisPoints,
          maxFee: BigInt(
            quoteToken.extensions.feeConfig.newerTransferFee.maximumFee,
          ),
        }
      : undefined;

    const rewardFee = rewardToken?.mint?.extensions?.feeConfig
      ? {
          feeBps:
            rewardToken.mint.extensions.feeConfig.newerTransferFee
              .transferFeeBasisPoints,
          maxFee: BigInt(
            rewardToken.mint.extensions.feeConfig.newerTransferFee.maximumFee,
          ),
        }
      : undefined;

    const { tokenEstA, tokenEstB } = decreaseLiquidityQuote(
      position.data.liquidity,
      0,
      pool.sqrtPrice,
      position.data.tickLowerIndex,
      position.data.tickUpperIndex,
      baseFee,
      quoteFee,
    );

    const { rewards } = collectRewardsQuote(
      pool,
      position.data,
      lowerTickState!,
      upperTickState!,
      epochInfo.epoch,
      baseFee,
      quoteFee,
      rewardFee,
    );

    const rawAmountX = tokenEstA.toString();
    const rawFeeX = position.data.feeOwedA.toString();
    const rawFeeY = position.data.feeOwedB.toString();
    const rawAmountY = tokenEstB.toString();

    const rawRewardAmount = rewards
      .reduce((acc, curr) => acc + curr.rewardsOwed, 0n)
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
    const rewardAmount = new Decimal(rawRewardAmount)
      .div(Math.pow(10, baseToken.decimals))
      .toNumber();

    const priceX = prices[baseToken.id];
    const priceY = prices[quoteToken.id];

    if (priceX) {
      feeUsd += priceX.usd * feeX;
      amountUsd += priceX.usd * amountX;
    }

    if (priceY) {
      feeUsd += priceY.usd * feeY;
      amountUsd += priceY.usd * amountY;
    }

    if (rewardToken) {
      const priceReward = prices[rewardToken.mint.id];
      if (priceReward) rewardUsd += priceReward.usd * rewardAmount;
    }

    const tvl = offchainPosition.amountUsd;
    const totalTVL = amountUsd + feeUsd + rewardUsd;
    const pnlUsd = tvl - totalTVL;

    positionUpdates.push({ id: offchainPosition.id, update: { active } });
    pnlUpdates.push({
      feeUsd,
      pnlUsd,
      rewardUsd,
      amountUsd,
      state: "opened",
      claimedFeeUsd: 0,
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
  id: (typeof positions.$inferSelect)["id"],
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
  rpc: Rpc<SolanaRpcApi>,
  poolId: string,
) {
  const pool = await getPoolById(db, poolId);

  if (pool) return pool;
  const { data: pair } = await fetchWhirlpool(rpc, address(poolId));

  const rewardPubkeys = mapFilter(pair.rewardInfos, (reward) =>
    fromLegacyPublicKey(PublicKey.default) === reward.mint ? null : reward.mint,
  );
  const mintPubkeys = [pair.tokenMintA, pair.tokenMintB, ...rewardPubkeys];

  const mintAccountInfos = await chunkFetchMultipleAccounts(
    mintPubkeys,
    (keys) =>
      rpc
        .getMultipleAccounts(keys)
        .send()
        .then(({ value }) => value),
  );
  const mintValues = mapFilter(mintAccountInfos, (mintAccountInfo) => {
    if (mintAccountInfo) {
      if (isNative(mintAccountInfo.owner))
        return {
          decimals: 9,
          id: mintAccountInfo.publicKey,
          tokenProgram: mintAccountInfo.owner,
        };
      else if (isTokenProgram(mintAccountInfo.owner)) {
        const mintDecoder = getMintDecoder();
        const [data, encoding] = mintAccountInfo.data;
        const account = mintDecoder.decode(Buffer.from(data, encoding));
        return {
          decimals: account.decimals,
          id: mintAccountInfo.publicKey,
          tokenProgram: mintAccountInfo.owner,
        };
      }
    }
  });

  if (mintValues.length > 0)
    await db.insert(mints).values(mintValues).onConflictDoNothing().execute();

  await db.insert(pools).values({
    id: poolId,
    dex: "orca",
    config: {},
    baseToken: pair.tokenMintA,
    quoteToken: pair.tokenMintB,
    rewardTokens: rewardPubkeys,
  });

  await db.insert(poolRewardTokens).values(
    rewardPubkeys.map((pubkey) => ({
      pool: poolId,
      mint: pubkey,
    })),
  );

  return getPoolById(db, poolId);
}

export const syncOrcaPositionStateFromEvent = async (
  db: Database,
  rpc: Rpc<SolanaRpcApi>,
  coingecko: Coingecko,
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id">,
  events: ProgramEventType<Whirlpool>[],
  _extra: { signature: string },
) => {
  const results = [];

  for (const event of events) {
    if (event.name === "liquidityIncreased") {
      const data = event.data;
      let position = await getPositionById(db, data.position.toBase58());

      if (!position) {
        const pool = await upsertPool(db, rpc, data.whirlpool.toBase58());

        assert(pool, "pool not created");

        await db
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
          .returning();

        position = await getPositionById(db, data.position.toBase58());
      }

      if (position) {
        const { pool } = position;
        const rawAmountX = data.tokenAAmount,
          rawAmountY = data.tokenBAmount;
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
    } else if (event.name === "liquidityDecreased") {
      const data = event.data;

      const positionId = data.position.toBase58();

      const position = await getPositionById(db, positionId);

      if (position) {
        const { pool } = position;
        const rawAmountX = data.tokenAAmount,
          rawAmountY = data.tokenBAmount;
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
    }
  }

  return results;
};
