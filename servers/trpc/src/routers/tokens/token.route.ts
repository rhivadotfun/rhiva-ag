import z from "zod";
import Dex from "@rhiva-ag/dex";
import { loadWallet } from "@rhiva-ag/shared";
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
      const wallet = loadWallet(ctx.user.wallet, ctx.secret);
      return dex.swap.jupiter.buildSwap({
        ...input,
        owner: wallet.publicKey,
      });
    }),
});
