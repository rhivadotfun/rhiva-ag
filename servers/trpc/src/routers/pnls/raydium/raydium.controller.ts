import BN from "bn.js";
import moment from "moment";
import Decimal from "decimal.js";
import { mapFilter } from "@rhiva-ag/shared";
import { PublicKey, type Connection } from "@solana/web3.js";
import type Coingecko from "@coingecko/coingecko-typescript";
import { Pipeline, type ProgramEventType } from "@rhiva-ag/decoder";
import type { AmmV3 } from "@rhiva-ag/decoder/programs/idls/types/raydium";
import {
  RaydiumProgramEventProcessor,
  RaydiumProgramInstructionEventProcessor,
} from "@rhiva-ag/decoder/programs/raydium/index";

import type { Position } from "../types";

export const getRaydiumPositionPnLById = async (
  coingecko: Coingecko,
  connection: Connection,
  position: Position,
) => {
  const signatures = await connection.getSignaturesForAddress(
    new PublicKey(position.id),
  );
  let rawBaseAmountIn = new BN(0),
    rawBaseAmountOut = new BN(0);
  let rawQuoteAmountIn = new BN(0),
    rawQuoteAmountOut = new BN(0);
  const rawRewardsAmountOut: BN[][] = [];

  const onEvent = async (events: ProgramEventType<AmmV3>[]) => {
    for (const event of events) {
      if (event.name === "createPersonalPositionEvent") {
        const baseAmount = event.data.depositAmount0;
        const quoteAmount = event.data.depositAmount1;
        rawBaseAmountIn = rawBaseAmountIn.add(baseAmount);
        rawQuoteAmountIn = rawQuoteAmountIn.add(quoteAmount);
      }
      if (event.name === "increaseLiquidityEvent") {
        const baseAmount = event.data.amount0;
        const quoteAmount = event.data.amount1;
        rawBaseAmountIn = rawBaseAmountIn.add(baseAmount);
        rawQuoteAmountIn = rawQuoteAmountIn.add(quoteAmount);
      }
      if (event.name === "collectPersonalFeeEvent") {
        const baseAmount = event.data.amount0;
        const quoteAmount = event.data.amount1;
        rawBaseAmountOut = rawBaseAmountOut.add(baseAmount);
        rawQuoteAmountOut = rawQuoteAmountOut.add(quoteAmount);
      }
      if (event.name === "decreaseLiquidityEvent") {
        const baseAmount = event.data.decreaseAmount0.add(
          event.data.feeAmount0,
        );
        const quoteAmount = event.data.decreaseAmount1.add(
          event.data.feeAmount1,
        );
        rawRewardsAmountOut.push(event.data.rewardAmounts);
        rawBaseAmountOut = rawBaseAmountOut.add(baseAmount);
        rawQuoteAmountOut = rawQuoteAmountOut.add(quoteAmount);
      }
    }
  };

  const pipeline = new Pipeline([
    new RaydiumProgramEventProcessor(connection).addConsumer(onEvent),
    new RaydiumProgramInstructionEventProcessor(connection).addConsumer(
      (instructions) =>
        onEvent(instructions.map((instruction) => instruction.parsed)),
    ),
  ]);

  const transactions = mapFilter(
    await connection.getParsedTransactions(
      signatures.map(({ signature }) => signature),
      {
        maxSupportedTransactionVersion: 0,
      },
    ),
    (transaction) => transaction,
  );

  await pipeline.process(...transactions);

  const { baseToken, quoteToken } = position.pool;
  const baseAmountIn = new Decimal(rawBaseAmountIn.toString())
    .div(Math.pow(10, baseToken.decimals))
    .toNumber();
  const baseAmountOut = new Decimal(rawBaseAmountOut.toString())
    .div(Math.pow(10, baseToken.decimals))
    .toNumber();
  const quoteAmountIn = new Decimal(rawQuoteAmountIn.toString())
    .div(Math.pow(10, quoteToken.decimals))
    .toNumber();
  const quoteAmountOut = new Decimal(rawQuoteAmountOut.toString())
    .div(Math.pow(10, quoteToken.decimals))
    .toNumber();

  let openBasePrice = position.config.history?.openPrice?.baseToken;
  let openQuotePrice = position.config.history?.openPrice?.quoteToken;

  let closeBasePrice = position.config.history?.closingPrice?.baseToken;
  let closeQuotePrice = position.config.history?.closingPrice?.quoteToken;

  const mints: string[] = [];
  if (position.pool.rewardTokens)
    mints.push(...position.pool.rewardTokens.map((token) => token.mint.id));

  if (!openBasePrice || !closeBasePrice) mints.push(baseToken.id);
  if (!openQuotePrice || !closeQuotePrice) mints.push(quoteToken.id);

  let prices: Record<string, { usd: number }> = {};

  if (mints.length > 0) {
    prices = (await coingecko.simple.tokenPrice.getID("solana", {
      vs_currencies: "usd",
      contract_addresses: Array.from(mints).join(","),
    })) as Record<string, { usd: number }>;

    openBasePrice = openBasePrice ?? prices[baseToken.id]?.usd;
    openQuotePrice = openQuotePrice ?? prices[quoteToken.id]?.usd;
    closeBasePrice = closeBasePrice ?? prices[baseToken.id]?.usd;
    closeQuotePrice = closeQuotePrice ?? prices[quoteToken.id]?.usd;
  }

  let openAmountUsd = 0;
  let closeAmountUsd = 0;

  if (openBasePrice && closeBasePrice) {
    openAmountUsd += openBasePrice * baseAmountIn;
    closeAmountUsd += closeBasePrice * baseAmountOut;
  }
  if (openQuotePrice && closeQuotePrice) {
    openAmountUsd += openQuotePrice * quoteAmountIn;
    closeAmountUsd += closeQuotePrice * quoteAmountOut;
  }

  for (const rawRewardAmountOut of rawRewardsAmountOut) {
    if (position.pool.rewardTokens)
      for (const [index, rewardToken] of position.pool.rewardTokens.entries()) {
        const price = prices[rewardToken.mint.id]?.usd;
        const rawRewardAmount = rawRewardAmountOut[index];
        if (rawRewardAmount && price) {
          const rewardAmount = new Decimal(rawRewardAmount.toString())
            .div(Math.pow(10, rewardToken.mint.decimals))
            .toNumber();
          closeAmountUsd += price * rewardAmount;
        }
      }
  }

  const amountUsdChange = closeAmountUsd - openAmountUsd;

  return {
    openAmountUsd,
    closeAmountUsd,
    amountUsdChange,
    tvl: openAmountUsd,
    pnl: (amountUsdChange / openAmountUsd) * 100,
    duration: moment(position.updatedAt).diff(moment(position.createdAt)),
  };
};
