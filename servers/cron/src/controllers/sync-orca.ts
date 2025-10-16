import type { z } from "zod/mini";
import Decimal from "decimal.js";
import { and, eq, inArray, not } from "drizzle-orm";
import type Coingecko from "@coingecko/coingecko-typescript";
import {
  chunkFetchMultipleAccounts,
  collectionToMap,
  promiseMapFilter,
} from "@rhiva-ag/shared";
import {
  getTickIndexInArray,
  decreaseLiquidityQuote,
  collectRewardsQuote,
} from "@orca-so/whirlpools-core";
import {
  getWhirlpoolDecoder,
  getTickArrayAddress,
  getTickArrayDecoder,
  fetchAllPositionWithFilter,
  positionMintFilter,
} from "@orca-so/whirlpools-client";
import {
  pnls,
  positions,
  type Database,
  type walletSelectSchema,
} from "@rhiva-ag/datasource";
import {
  isAddress,
  type Address,
  type GetMultipleAccountsApi,
  type GetTokenAccountsByOwnerApi,
  type GetEpochInfoApi,
  type ProgramDerivedAddress,
  type Rpc,
  type GetProgramAccountsApi,
  address,
} from "@solana/kit";

export const syncRaydiumPositionsForWallet = async (
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
  const whirlPoolPositions = await fetchAllPositionWithFilter(
    rpc,
    ...walletPositions.map((position) =>
      positionMintFilter(address(position.id)),
    ),
  );

  const whirlpoolIds = new Set(
    whirlPoolPositions.map((position) => position.data.whirlpool),
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
    whirlPoolPositions,
    async (position) => {
      const pool = whirlpoolAccountsMap.get(position.address);
      const ticks = [
        position.data.tickLowerIndex,
        position.data.tickUpperIndex,
      ];
      if (!pool) return;

      const [[lowerTickArrayAddress], [upperTickArrayAddress]] =
        (await Promise.all(
          ticks.map((tick) => getTickArrayAddress(position.address, tick)),
        )) as [ProgramDerivedAddress, ProgramDerivedAddress];

      tickArrayAddresses.push(lowerTickArrayAddress, upperTickArrayAddress);

      mints.add(pool.tokenMintA);
      mints.add(pool.tokenMintB);
      for (const rewardInfo of pool.rewardInfos)
        if (isAddress(rewardInfo.mint)) mints.add(rewardInfo.mint);

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
  const tickArraysMap = collectionToMap(
    await chunkFetchMultipleAccounts(
      tickArrayAddresses,
      (keys) =>
        rpc
          .getMultipleAccounts(keys)
          .send()
          .then(({ value }) => value),
      (account) => {
        const [data, encoding] = account.data;
        return tickArrayCodec.decode(Buffer.from(data, encoding));
      },
    ),
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
    const lowerTickArray = tickArraysMap.get(position.lowerTickArrayAddress);
    const upperTickArray = tickArraysMap.get(position.upperTickArrayAddress);
    const offchainPosition = positionsMap.get(position.address);

    if (!offchainPosition || !lowerTickArray || !upperTickArray) return;

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
