import z from "zod";
import Dex from "@rhiva-ag/dex";
import Decimal from "decimal.js";
import { loadWallet } from "@rhiva-ag/shared";
import { rewards } from "@rhiva-ag/datasource";
import type { TradeGetResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/pools/trades.js";
import type { OhlcvGetTimeframeResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/pools/ohlcv.js";

import { privateProcedure, publicProcedure, router } from "../../trpc";
import {
  tokenChartFilter,
  tokenSwapSchema,
  tokenTradeFilter,
} from "./token.schema";

export const tokenRoute = router({
  chart: publicProcedure
    .input(
      z.object({
        network: z.enum(["solana"]),
        token_address: z.string(),
        timeframe: z.enum(["day", "hour", "minute", "second"]),
        filter: tokenChartFilter.optional(),
      }),
    )
    .query(async ({ ctx, input: { filter, timeframe, ...input } }) => {
      const response =
        await ctx.coingecko.onchain.networks.tokens.ohlcv.getTimeframe(
          timeframe,
          {
            ...input,
            ...filter,
          },
        );

      return {
        base_token: response.meta?.base,
        quote_token: response.meta?.quote,
        ohlcv_list: response.data?.attributes?.ohlcv_list,
      } as NonNullable<OhlcvGetTimeframeResponse.Data["attributes"]> & {
        base_token: NonNullable<OhlcvGetTimeframeResponse.Meta.Base>;
        quote_token: NonNullable<OhlcvGetTimeframeResponse.Meta.Quote>;
      };
    }),
  trades: publicProcedure
    .input(
      z.object({
        token_address: z.string(),
        network: z.enum(["solana"]),
        filter: tokenTradeFilter.optional(),
      }),
    )
    .query(async ({ ctx, input: { token_address, ...input } }) => {
      const response = await ctx.coingecko.onchain.networks.pools.trades.get(
        token_address,
        input,
      );

      return response.data?.map(
        (data) => data.attributes,
      ) as NonNullable<TradeGetResponse.Data.Attributes>[];
    }),
  swap: privateProcedure
    .input(tokenSwapSchema)
    .mutation(async ({ ctx, input }) => {
      const dex = new Dex(ctx.connection);
      const wallet = await loadWallet(ctx.user.wallet, ctx.secret);

      const { quote, transaction } = await dex.swap.jupiter.buildSwap({
        ...input,
        owner: wallet.publicKey,
        amount:
          BigInt(input.amount) * BigInt(Math.pow(10, input.inputDecimals)),
      });

      const prices = (await ctx.coingecko.simple.tokenPrice.getID("solana", {
        vs_currencies: "usd",
        contract_addresses: [input.inputMint, input.outputMint].join(","),
      })) as Record<string, { usd: number }>;

      let amountUsd = 0;
      const rawInputAmount = quote[input.inputMint];
      const rawOutputAmount = quote[input.outputMint];

      if (rawInputAmount) {
        const inputAmount = new Decimal(rawInputAmount)
          .div(Math.pow(10, input.inputDecimals))
          .toNumber();
        const price = prices[input.inputMint];
        if (price) amountUsd += price.usd * inputAmount;
      }

      if (rawOutputAmount) {
        const outputAmount = new Decimal(rawOutputAmount)
          .div(Math.pow(10, input.outputDecimals))
          .toNumber();
        const price = prices[input.outputMint];
        if (price) amountUsd += price.usd * outputAmount;
      }

      const { result } = await ctx.sendTransaction.sendBundle([transaction]);

      if (amountUsd > 0)
        await ctx.drizzle.insert(rewards).values({
          key: "swap",
          user: ctx.user.id,
          xp: Math.floor(amountUsd),
        });

      return result;
    }),
});
