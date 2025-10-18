import z from "zod";
import { TRPCError } from "@trpc/server";
import { mapFilter, type NonNullable } from "@rhiva-ag/shared";
import type { MegafilterGetResponse } from "@coingecko/coingecko-typescript/resources/onchain/pools/megafilter.js";
import type { TradeGetResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/tokens/trades.js";
import type { OhlcvGetTimeframeResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/tokens/ohlcv.js";

import { publicProcedure, router } from "../../trpc";
import {
  poolChartFilter,
  poolFilterSchema,
  poolSearchSchema,
  poolTradeFilter,
} from "./pool.schema";
import type { PoolGetResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks/tokens.mjs";

export const poolRoute = router({
  list: publicProcedure
    .input(
      z
        .union([poolFilterSchema.optional(), poolSearchSchema.optional()])
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      let response: MegafilterGetResponse | PoolGetResponse;
      if (input && "query" in input)
        response = await ctx.coingecko.onchain.search.pools.get(input);
      else response = await ctx.coingecko.onchain.pools.megafilter.get(input);

      if (response.data && response.included) {
        const { data, included } = response;
        const mapIncludes = new Map(
          included.map((include) => [include.id, include.attributes]),
        );

        return mapFilter(data, (data) => {
          const { relationships, attributes } = data;
          if (relationships && attributes) {
            const base_token = mapIncludes.get(
              relationships.base_token?.data?.id,
            );
            const quote_token = mapIncludes.get(
              relationships.quote_token?.data?.id,
            );

            if (base_token && quote_token)
              return {
                ...attributes,
                dex: relationships.dex?.data,
                base_token,
                quote_token,
              } as NonNullable<MegafilterGetResponse.Data.Attributes> & {
                dex: NonNullable<MegafilterGetResponse.Data.Relationships.Dex.Data>;
                base_token: NonNullable<MegafilterGetResponse.Included.Attributes>;
                quote_token: NonNullable<MegafilterGetResponse.Included.Attributes>;
              };
          }

          return null;
        });
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "included required in filter param",
      });
    }),

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
