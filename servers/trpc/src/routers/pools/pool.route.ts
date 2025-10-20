import z from "zod";
import type { TradeGetResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/tokens/trades.js";
import type { OhlcvGetTimeframeResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/tokens/ohlcv.js";

import { getPools } from "./pool.controller";
import { publicProcedure, router } from "../../trpc";
import {
  poolChartFilter,
  poolFilterSchema,
  poolSearchSchema,
  poolTradeFilter,
} from "./pool.schema";

export const poolRoute = router({
  list: publicProcedure
    .input(
      z
        .union([poolFilterSchema.optional(), poolSearchSchema.optional()])
        .optional(),
    )
    .query(async ({ ctx, input }) => getPools(ctx.coingecko, input)),

  chart: publicProcedure
    .input(
      z.object({
        pool_address: z.string(),
        network: poolSearchSchema.shape.network.nonoptional(),
        timeframe: z.enum(["day", "hour", "minute", "second"]),
        filter: poolChartFilter.optional(),
      }),
    )
    .query(async ({ ctx, input: { filter, timeframe, ...input } }) => {
      const response =
        await ctx.coingecko.onchain.networks.pools.ohlcv.getTimeframe(
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
        pool_address: z.string(),
        network: poolSearchSchema.shape.network.nonoptional(),
        filter: poolTradeFilter.optional(),
      }),
    )
    .query(async ({ ctx, input: { pool_address, ...input } }) => {
      const response = await ctx.coingecko.onchain.networks.pools.trades.get(
        pool_address,
        input,
      );

      return response.data?.map(
        (data) => data.attributes,
      ) as NonNullable<TradeGetResponse.Data.Attributes>[];
    }),
});
