import { address } from "@rhiva-ag/datasource";
import z, { number } from "zod";

export const tokenChartFilter = z.object({
  before_timestamp: z.number().optional(),
  currency: z.enum(["usd", "token"]).optional(),
  include_empty_intervals: z.boolean().optional(),
  limit: z.number().max(1000).default(100).optional(),
  token: z.enum(["base", "quote", "token"]).default("base").optional(),
  aggregate: z.enum(["1", "5", "4", "12", "15", "30"]).default("1").optional(),
});

export const tokenTradeFilter = z.object({
  token: tokenChartFilter.shape.token,
  trade_volume_in_usd_greater_than: z.number(),
});

export const tokenSwapSchema = z.object({
  amount: number(),
  slippage: number(),
  inputMint: address(),
  outputMint: address(),
});
