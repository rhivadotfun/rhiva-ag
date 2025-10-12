import z from "zod";
import type { TradeGetResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/pools/trades.js";
import type { OhlcvGetTimeframeResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/pools/ohlcv.js";

import { privateProcedure, publicProcedure, router } from "../../trpc";
import {
  tokenChartFilter,
  tokenFilterSchema,
  tokenTradeFilter,
} from "./token.schema";

export const tokenRoute = router({
  list: publicProcedure
    .input(z.object({ page: z.number().optional() }).optional())
    .query(({ ctx, input }) => {
      return ctx.solanatracker.getLatestTokens(input?.page);
    }),
  retrieve: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.solanatracker.getTokenInfo(input);
  }),
  search: publicProcedure
    .input(tokenFilterSchema)
    .query(async ({ ctx, input }) => {
      return ctx.solanatracker.searchTokens(input).then(({ data }) => data);
    }),
  chart: publicProcedure
    .input(
      z.object({
        token_address: z.string(),
        network: tokenFilterSchema.shape.network.nonoptional(),
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
        network: tokenFilterSchema.shape.network.nonoptional(),
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
  pnl: privateProcedure.query(async ({ ctx }) => {
    return ctx.solanatracker.getWalletPnL(ctx.user.wallet.id);
  }),
});
