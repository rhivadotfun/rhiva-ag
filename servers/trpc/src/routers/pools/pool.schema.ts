import z from "zod";
import { commaEnum } from "@rhiva-ag/datasource";

export const poolFilterSchema = z.object({
  fdv_usd_min: z.number().optional(),
  fdv_usd_max: z.number().optional(),
  buys_min: z.number().int().optional(),
  buys_max: z.number().int().optional(),
  sells_min: z.number().int().optional(),
  sells_max: z.number().int().optional(),
  page: z.number().optional(),
  tx_count_min: z.number().int().optional(),
  tx_count_max: z.number().int().optional(),
  reserve_in_usd_min: z.number().optional(),
  reserve_in_usd_max: z.number().optional(),
  h24_volume_usd_min: z.number().optional(),
  h24_volume_usd_max: z.number().optional(),
  networks: commaEnum(["solana"]).default("solana"),
  pool_created_hour_min: z.number().optional(),
  pool_created_hour_max: z.number().optional(),
  buy_tax_percentage_min: z.number().optional(),
  buy_tax_percentage_max: z.number().optional(),
  sell_tax_percentage_min: z.number().optional(),
  sell_tax_percentage_max: z.number().optional(),
  include_unknown_honeypot_tokens: z.boolean().optional(),
  buys_duration: z.enum(["5m", "1h", "6h", "24h"]).optional(),
  sells_duration: z.enum(["5m", "1h", "6h", "24h"]).optional(),
  tx_count_duration: z.enum(["5m", "1h", "6h", "24h"]).optional(),
  dexes: commaEnum(["orca", "saros-dlmm", "meteora", "raydium-clmm"])
    .default("orca,meteora,raydium-clmm")
    .optional(),
  include: commaEnum(["base_token", "quote_token", "dex", "network"])
    .default("base_token,quote_token,dex,network")
    .optional(),
  checks: commaEnum([
    "no_honeypot",
    "good_gt_score",
    "on_coingecko",
    "has_social",
  ]).optional(),
  sort: z
    .enum([
      "m5_trending",
      "h1_trending",
      "h6_trending",
      "h24_trending",
      "fdv_usd_asc",
      "fdv_usd_desc",
      "reserve_in_usd_asc",
      "reserve_in_usd_desc",
      "h24_tx_count_desc",
      "h24_volume_usd_desc",
      "pool_created_at_desc",
      "m5_price_change_percentage_asc",
      "h1_price_change_percentage_asc",
      "h6_price_change_percentage_asc",
      "h24_price_change_percentage_asc",
      "m5_price_change_percentage_desc",
      "h1_price_change_percentage_desc",
      "h6_price_change_percentage_desc",
      "h24_price_change_percentage_desc",
    ])
    .optional(),
});

export const poolSearchSchema = z.object({
  query: z.string(),
  page: z.number().default(1).optional(),
  include: poolFilterSchema.shape.include.optional(),
  network: z.enum(["solana"]).default("solana").optional(),
});

export const poolChartFilter = z.object({
  before_timestamp: z.number().optional(),
  currency: z.enum(["usd", "token"]).optional(),
  include_empty_intervals: z.boolean().optional(),
  limit: z.number().max(1000).default(100).optional(),
  token: z.enum(["base", "quote", "token"]).default("base").optional(),
  aggregate: z.enum(["1", "5", "4", "12", "15", "30"]).default("1").optional(),
});

export const poolTradeFilter = z.object({
  token: poolChartFilter.shape.token,
  trade_volume_in_usd_greater_than: z.number(),
});
