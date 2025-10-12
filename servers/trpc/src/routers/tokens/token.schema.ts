import z from "zod";

export const tokenFilterSchema = z.object({
  query: z.string().optional(),
  symbol: z.string().optional(),
  lpBurn: z.number().optional(),
  market: z.string().optional(),
  minBuys: z.number().optional(),
  maxBuys: z.number().optional(),
  minSells: z.number().optional(),
  maxSells: z.number().optional(),
  deployer: z.string().optional(),
  minVolume: z.number().optional(),
  maxVolume: z.number().optional(),
  minCreatedAt: z.number().optional(),
  maxCreatedAt: z.number().optional(),
  minLiquidity: z.number().optional(),
  maxLiquidity: z.number().optional(),
  minMarketCap: z.number().optional(),
  maxMarketCap: z.number().optional(),
  mintAuthority: z.string().optional(),
  showAllPools: z.boolean().optional(),
  page: z.number().default(1).optional(),
  freezeAuthority: z.string().optional(),
  showPriceChanges: z.boolean().optional(),
  limit: z.number().default(100).optional(),
  minTotalTransactions: z.number().optional(),
  maxTotalTransactions: z.number().optional(),
  status: z.enum(["graduating", "graduated"]).optional(),
  network: z.enum(["solana"]).default("solana").optional(),
  sortOrder: z.enum(["desc", "asc"]).default("desc").optional(),
  volumeTimeFrame: z
    .enum(["5m", "15m", "30m", "1h", "6h", "12h", "24h"])
    .optional(),
  sortBy: z
    .enum([
      "liquidityUsd",
      "marketCapUsd",
      "priceUsd",
      "volume",
      "holders",
      "top10",
      "dev",
      "insiders",
      "snipers",
      "buys",
      "sells",
      "totalTransactions",
      "fees.total",
      "fees.totalTrading",
      "fees.totalTips",
      "createdAt",
      "lpBurn",
      "curvePercentage",
    ])
    .optional(),
});

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
