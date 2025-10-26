import BN from "bn.js";
import moment from "moment";
import Decimal from "decimal.js";
import { mapFilter } from "@rhiva-ag/shared";
import { PublicKey, type Connection } from "@solana/web3.js";
import type Coingecko from "@coingecko/coingecko-typescript";
import { Pipeline, type ProgramEventType } from "@rhiva-ag/decoder";
import type { LbClmm } from "@rhiva-ag/decoder/programs/idls/types/meteora";
import {
  MeteoraProgramEventProcessor,
  MeteoraProgramInstructionEventProcessor,
} from "@rhiva-ag/decoder/programs/meteora/index";

import type { Position } from "../types";

export const getMeteoraPositionPnLById = async (
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

  const onEvent = async (events: ProgramEventType<LbClmm>[]) => {
    for (const event of events) {
      if (event.name === "addLiquidity") {
        const [baseAmount, quoteAmount] = event.data.amounts;
        if (baseAmount) rawBaseAmountIn = rawBaseAmountIn.add(baseAmount);
        if (quoteAmount) rawQuoteAmountIn = rawQuoteAmountIn.add(quoteAmount);
      }
      if (event.name === "claimFee") {
        const data = event.data;
        rawBaseAmountOut = rawBaseAmountOut.add(data.feeX);
        rawQuoteAmountOut = rawQuoteAmountOut.add(data.feeY);
      }
      if (event.name === "claimReward") {
        /// todo
      }
      if (event.name === "removeLiquidity") {
        const [baseAmount, quoteAmount] = event.data.amounts;
        if (baseAmount) rawBaseAmountOut = rawBaseAmountOut.add(baseAmount);
        if (quoteAmount) rawQuoteAmountOut = rawQuoteAmountOut.add(quoteAmount);
      }
    }
  };

  const pipeline = new Pipeline([
    new MeteoraProgramEventProcessor(connection).addConsumer(onEvent),
    new MeteoraProgramInstructionEventProcessor(connection).addConsumer(
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
  if (!openBasePrice || !closeBasePrice) mints.push(baseToken.id);
  if (!openQuotePrice || !closeQuotePrice) mints.push(quoteToken.id);

  if (mints.length > 0) {
    const prices = (await coingecko.simple.tokenPrice.getID("solana", {
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

  const amountUsdChange = closeAmountUsd - openAmountUsd;

  return {
    amountUsdChange,
    tvl: openAmountUsd,
    pnl: (amountUsdChange / openAmountUsd) * 100,
    duration: moment(position.updatedAt).diff(moment(position.createdAt)),
  };
};
