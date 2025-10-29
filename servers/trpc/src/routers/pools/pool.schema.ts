import z from "zod";
import { commaEnum } from "@rhiva-ag/datasource";

export const poolFilterSchema = z.object({
  query: z.string().optional(),
  page: z.number().describe("page through results").optional(),
  reserve_in_usd_min: z.number().describe("minimum reserve in USD").optional(),
  reserve_in_usd_max: z.number().describe("maximum reserve in USD").optional(),
  fdv_usd_min: z
    .number()
    .describe("minimum fully diluted value in USD")
    .optional(),
  fdv_usd_max: z
    .number()
    .describe("maximum fully diluted value in USD")
    .optional(),
  tx_count_min: z
    .number()
    .int()
    .describe("minimum transaction count")
    .optional(),
  tx_count_max: z
    .number()
    .int()
    .describe("maximum transaction count")
    .optional(),
  h24_volume_usd_min: z
    .number()
    .describe("minimum 24hr volume in USD")
    .optional(),
  h24_volume_usd_max: z
    .number()
    .describe("maximum 24hr volume in USD")
    .optional(),
  pool_created_hour_min: z
    .number()
    .describe("minimum pool age in hours")
    .optional(),
  pool_created_hour_max: z
    .number()
    .describe("maximum pool age in hours")
    .optional(),
  buys_min: z
    .number()
    .int()
    .describe("minimum number of buy transactions")
    .optional(),
  buys_max: z
    .number()
    .int()
    .describe("maximum number of buy transactions")
    .optional(),
  sells_min: z
    .number()
    .int()
    .describe("minimum number of sell transactions")
    .optional(),
  sells_max: z
    .number()
    .int()
    .describe("minimum number of sell transactions")
    .optional(),
  networks: commaEnum(["solana"])
    .describe("filter pools by networks")
    .default("solana"),
  buy_tax_percentage_min: z
    .number()
    .describe("minimum buy tax percentage")
    .optional(),
  buy_tax_percentage_max: z
    .number()
    .describe("maximum buy tax percentage")
    .optional(),
  sell_tax_percentage_min: z
    .number()
    .describe("minimum sell tax percentage")
    .optional(),
  sell_tax_percentage_max: z
    .number()
    .describe("maximum sell tax percentage")
    .optional(),
  include_unknown_honeypot_tokens: z
    .boolean()
    .describe(
      "when checks includes no_honeypot, set to true to also include 'unknown honeypot' tokens",
    )
    .optional(),
  buys_duration: z
    .enum(["5m", "1h", "6h", "24h"])
    .describe("duration for buy transactions metric")
    .optional(),
  sells_duration: z
    .enum(["5m", "1h", "6h", "24h"])
    .describe("duration for sell transactions metric")
    .optional(),
  tx_count_duration: z
    .enum(["5m", "1h", "6h", "24h"])
    .describe("duration for transaction count metric")
    .optional(),
  dexes: commaEnum(["orca", "saros-dlmm", "meteora", "raydium-clmm"])
    .default("orca,meteora,raydium-clmm")
    .describe("filter pools by Dexes.")
    .optional(),
  include: commaEnum(["base_token", "quote_token", "dex", "network"])
    .default("base_token,quote_token,dex,network")
    .describe("attributes to include")
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
    .describe("sort the pools by field.")
    .optional(),
});

export const poolSearchSchema = z.object({
  query: z.string().optional(),
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

export const poolAnalyticSchema = z.object({
  tvl: z.number(),
  volume: z.number(),
  fees: z.number(),
});
