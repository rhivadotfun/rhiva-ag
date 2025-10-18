import type { z } from "zod/mini";
import Decimal from "decimal.js";
import DLMM from "@meteora-ag/dlmm";
import { and, eq, inArray, not } from "drizzle-orm";
import type { ProgramEventType } from "@rhiva-ag/decoder";
import { PublicKey, type Connection } from "@solana/web3.js";
import type Coingecko from "@coingecko/coingecko-typescript";
import type { LbClmm } from "@rhiva-ag/decoder/programs/idls/types/meteora";
import {
  collectionToMap,
  flatMapFilter,
  loadWallet,
  type Secret,
} from "@rhiva-ag/shared";
import {
  pnls,
  positions,
  type Database,
  type walletSelectSchema,
} from "@rhiva-ag/datasource";

export const syncMeteoraPositionsForWallet = async (
  connection: Connection,
  secret: Secret,
  coingecko: Coingecko,
  db: Database,
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id" | "key">,
) => {
  const owner = loadWallet(wallet, secret);
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
    owner.publicKey,
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

    if (!offchainPosition) return;

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

export const syncMeteoraPositionStateFromEvent = async (
  events: ProgramEventType<LbClmm>[],
) => {
  for (const event of events) {
    if (event.name === "addLiquidity") {
      const data = event.data;
    } else if (event.name === "positionClose") {
    } else if (event.name === "removeLiquidity") {
    }
  }
};
