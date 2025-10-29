import { z } from "zod/v3";

export const positionInputSchema = z.object({
  wallet: z.string().describe("user wallet address"),
});

export const tokenInputSchema = z.object({
  limit: z
    .number()
    .describe("result limit count when category is not equal to search.")
    .optional()
    .nullable(),
  query: z
    .union([z.enum(["verified", "lst"]), z.string()])
    .describe("required when category is search or tag")
    .optional()
    .nullable(),
  timestamp: z
    .enum(["5m", "1h", "6h", "24h"])
    .describe(
      'Query by time interval for more accuracy. Required when category is "toporganicscore", "toptraded", "toptrending".',
    )
    .default("24h")
    .optional()
    .nullable(),
  category: z.union([
    z
      .enum(["toporganicscore", "toptraded", "toptrending"])
      .describe("Top tokens in different trading categories."),
    z.literal("tag").describe("Request tokens and their information by a tag."),
    z
      .literal("recent")
      .describe("Returns tokens that recently had their first created pool."),
    z
      .literal("search")
      .describe("Request a search by token's symbol, name or mint address."),
  ]),
});

export const poolInputSchema = z.object({
  page: z.number().describe("page through results").optional(),
  query: z.string().describe("token name, symbol or mint address").optional(),
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
  networks: z
    .enum(["solana"])
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
  dexes: z
    .array(z.enum(["orca", "saros-dlmm", "meteora", "raydium-clmm"]))
    .default(["orca", "meteora", "raydium-clmm"])
    .transform((input) => input.join(","))
    .describe("filter pools by Dexes.")
    .optional(),
  checks: z
    .array(
      z.enum(["no_honeypot", "good_gt_score", "on_coingecko", "has_social"]),
    )
    .transform((input) => input.join(","))
    .optional(),
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

const tokenSchema = z.object({
  id: z.string(),
  name: z.string().optional().nullable(),
  symbol: z.string().optional().optional().nullable(),
  image: z.string().optional().optional().nullable(),
  decimals: z.number().int(),
  tokenProgram: z.string(),
  addressLookupTables: z.array(z.string()).optional().nullable(),
});

export const tokenOutputSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  fdv: z.number().optional().nullable(),
  mcap: z.number().optional().nullable(),
  symbol: z.string().optional().nullable(),
  decimals: z.number().optional().nullable(),
  ctLikes: z.number().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  usdPrice: z.number().optional().nullable(),
  liquidity: z.number().optional().nullable(),
  priceBlockId: z.number().optional().nullable(),
  smartCtLikes: z.number().optional().nullable(),
  circSupply: z.number().optional().nullable(),
  totalSupply: z.number().optional().nullable(),
  tokenProgram: z.string().optional().nullable(),
  holderCount: z.number().optional().nullable(),
  organicScore: z.number().optional().nullable(),
  isVerified: z.boolean().optional().nullable(),
  cexes: z.array(z.string()).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  stats5m: z
    .object({
      priceChange: z.number().optional().nullable(),
      numBuys: z.number().optional().nullable(),
      numSells: z.number().optional().nullable(),
      numTraders: z.number().optional().nullable(),
      buyVolume: z.number().optional().nullable(),
      sellVolume: z.number().optional().nullable(),
      volumeChange: z.number().optional().nullable(),
      numNetBuyers: z.number().optional().nullable(),
      liquidityChange: z.number().optional().nullable(),
      numOrganicBuyers: z.number().optional().nullable(),
      buyOrganicVolume: z.number().optional().nullable(),
      sellOrganicVolume: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  stats1h: z
    .object({
      priceChange: z.number().optional().nullable(),
      numBuys: z.number().optional().nullable(),
      numSells: z.number().optional().nullable(),
      numTraders: z.number().optional().nullable(),
      buyVolume: z.number().optional().nullable(),
      sellVolume: z.number().optional().nullable(),
      volumeChange: z.number().optional().nullable(),
      numNetBuyers: z.number().optional().nullable(),
      liquidityChange: z.number().optional().nullable(),
      numOrganicBuyers: z.number().optional().nullable(),
      buyOrganicVolume: z.number().optional().nullable(),
      sellOrganicVolume: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  stats6h: z
    .object({
      priceChange: z.number().optional().nullable(),
      numBuys: z.number().optional().nullable(),
      numSells: z.number().optional().nullable(),
      numTraders: z.number().optional().nullable(),
      buyVolume: z.number().optional().nullable(),
      sellVolume: z.number().optional().nullable(),
      volumeChange: z.number().optional().nullable(),
      numNetBuyers: z.number().optional().nullable(),
      liquidityChange: z.number().optional().nullable(),
      numOrganicBuyers: z.number().optional().nullable(),
      buyOrganicVolume: z.number().optional().nullable(),
      sellOrganicVolume: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  stats24h: z
    .object({
      priceChange: z.number().optional().nullable(),
      numBuys: z.number().optional().nullable(),
      numSells: z.number().optional().nullable(),
      numTraders: z.number().optional().nullable(),
      buyVolume: z.number().optional().nullable(),
      sellVolume: z.number().optional().nullable(),
      volumeChange: z.number().optional().nullable(),
      numNetBuyers: z.number().optional().nullable(),
      liquidityChange: z.number().optional().nullable(),
      numOrganicBuyers: z.number().optional().nullable(),
      buyOrganicVolume: z.number().optional().nullable(),
      sellOrganicVolume: z.number().optional().nullable(),
    })
    .nullable()
    .optional(),
  organicScoreLabel: z.enum(["low", "medium", "high"]).optional().nullable(),
  audit: z
    .object({
      topHoldersPercentage: z.number().optional().nullable(),
      mintAuthorityDisabled: z.boolean().optional().nullable(),
      freezeAuthorityDisabled: z.boolean().optional().nullable(),
    })
    .nullable()
    .optional(),
  firstPool: z
    .object({
      id: z.string().optional().nullable(),
      createdAt: z.string().optional().nullable(),
    })
    .nullable()
    .optional(),
});

export const poolOutputSchema = z.object({
  name: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  pool_created_at: z.string().optional().nullable(),
  reserve_in_usd: z.string().optional().nullable(),
  base_token_price_usd: z.string().optional().nullable(),
  quote_token_price_usd: z.string().optional().nullable(),
  base_token_price_base_token: z.string().optional().nullable(),
  base_token: z
    .object({
      address: z.string().optional().nullable(),
      name: z.string().optional().nullable(),
      symbol: z.string().optional().nullable(),
      decimals: z.number().optional().nullable(),
      image_url: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  quote_token: z
    .object({
      address: z.string().optional().nullable(),
      name: z.string().optional().nullable(),
      symbol: z.string().optional().nullable(),
      decimals: z.number().optional().nullable(),
      image_url: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  dex: z
    .object({
      id: z.string().optional().nullable(),
      name: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  quote_token_price_base_token: z.string().optional().nullable(),
  base_token_price_native_currency: z.string().optional().nullable(),
  quote_token_price_native_currency: z.string().optional().nullable(),
  volume_usd: z
    .object({
      h1: z.string().nullable().optional(),
      h24: z.string().nullable().optional(),
      h6: z.string().nullable().optional(),
      m15: z.string().nullable().optional(),
      m30: z.string().nullable().optional(),
      m5: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
  price_change_percentage: z
    .object({
      h1: z.string().nullable().optional(),
      h24: z.string().nullable().optional(),
      h6: z.string().nullable().optional(),
      m15: z.string().nullable().optional(),
      m30: z.string().nullable().optional(),
      m5: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
  transactions: z
    .object({
      m5: z
        .object({
          buys: z.number().optional().nullable(),
          sells: z.number().optional().nullable(),
          buyers: z.number().optional().nullable(),
          sellers: z.number().optional().nullable(),
        })
        .optional()
        .nullable(),
      m15: z
        .object({
          buys: z.number().optional().nullable(),
          sells: z.number().optional().nullable(),
          buyers: z.number().optional().nullable(),
          sellers: z.number().optional().nullable(),
        })
        .optional()
        .nullable(),
      m30: z
        .object({
          buys: z.number().optional().nullable(),
          sells: z.number().optional().nullable(),
          buyers: z.number().optional().nullable(),
          sellers: z.number().optional().nullable(),
        })
        .optional()
        .nullable(),
      h1: z
        .object({
          buys: z.number().optional().nullable(),
          sells: z.number().optional().nullable(),
          buyers: z.number().optional().nullable(),
          sellers: z.number().optional().nullable(),
        })
        .optional()
        .nullable(),
      h24: z
        .object({
          buys: z.number().optional().nullable(),
          sells: z.number().optional().nullable(),
          buyers: z.number().optional().nullable(),
          sellers: z.number().optional().nullable(),
        })
        .optional()
        .nullable(),
    })
    .nullable()
    .optional(),
});

export const positionOutputSchema = z.object({
  id: z.string(),
  wallet: z.string(),
  config: z.unknown(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  amountUsd: z.number(),
  baseAmount: z.number(),
  quoteAmount: z.number(),
  baseToken: tokenSchema,
  quoteToken: tokenSchema,
  status: z.enum(["error", "pending", "successful"]),
  state: z.enum(["idle", "open", "rebalanced", "repositioned", "closed"]),
  pnl: z.object({
    feeUsd: z.number(),
    pnlUsd: z.number(),
    amountUsd: z.number(),
    createdAt: z.string(),
    rewardUsd: z.number(),
    claimedFeeUsd: z.number(),
    state: z.enum(["opened", "closed"]),
  }),
});
