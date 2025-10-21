import z from "zod";
import { address, publicKey } from "@rhiva-ag/datasource";
import { jitoTipConfigSchema } from "../position.schema";

const orcaFullCreatePositionSchema = z.object({
  strategyType: z.literal("full"),
});
const orcaCustomCreatePositionSchema = z.object({
  strategyType: z.literal("custom"),
  tokenADecimals: z.number(),
  tokenBDecimals: z.number(),
  priceChanges: z.tuple([z.number(), z.number()]),
});

export const orcaCreatePositionSchema = z
  .union([orcaFullCreatePositionSchema, orcaCustomCreatePositionSchema])
  .and(
    z
      .object({
        pair: address(),
        slippage: z.number(),
        inputAmount: z.number(),
        inputMint: publicKey(),
      })
      .extend({
        jitoConfig: jitoTipConfigSchema
          .default({
            type: "dynamic",
            priorityFeePercentile: "50ema",
          })
          .optional(),
      }),
  );

export const orcaFlatCreatePositionSchema = z.object({
  slippage: z.number().describe("swap slippage"),
  inputAmount: z.number().describe("input amount"),
  inputMint: publicKey().describe("input amount mint address"),
  tokenADecimals: z
    .number()
    .describe("base token decimals. required when strategyType is custom"),
  tokenBDecimals: z.number().describe("quote token decimals"),
  strategyType: z
    .enum(["custom", "full"])
    .describe(
      "custom provides liquidity for a price range while full provides liquidity for all range",
    ),
  priceChanges: z
    .tuple([z.number().min(1).max(1), z.number().min(1).max(1)])
    .optional()
    .describe(
      "pool price changes in fractional percentile. required when strategyType is custom",
    ),
  jitoConfig: jitoTipConfigSchema
    .default({
      type: "dynamic",
      priorityFeePercentile: "50ema",
    })
    .optional(),
});

export const orcaClosePositionSchema = z
  .object({
    pair: address().describe("pool address"),
    slippage: z.number().describe("swap slippage"),
    position: address().describe("position address"),
    tokenA: z.object({
      mint: address().describe("pool base token mint address"),
      owner: address().describe("pool base token program address"),
      decimals: z.number().describe("pool base token decimals"),
    }),
    tokenB: z.object({
      mint: address().describe("pool quote token mint address"),
      owner: address().describe("pool quote token program address"),
      decimals: z.number().int().describe("pool quote token decimals"),
    }),
  })
  .extend({
    jitoConfig: jitoTipConfigSchema
      .default({
        type: "dynamic",
        priorityFeePercentile: "50ema",
      })
      .optional(),
  });
