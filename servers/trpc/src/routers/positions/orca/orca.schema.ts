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
        jitoConfig: jitoTipConfigSchema.default({
          type: "dynamic",
          priorityFeePercentile: "50ema",
        }),
      }),
  );

export const orcaClosePositionSchema = z
  .object({
    pair: address(),
    position: address(),
    slippage: z.number(),
    tokenA: z.object({
      mint: address(),
      owner: address(),
      decimals: z.number(),
    }),
    tokenB: z.object({
      mint: address(),
      owner: address(),
      decimals: z.number(),
    }),
  })
  .extend({
    jitoConfig: jitoTipConfigSchema.default({
      type: "dynamic",
      priorityFeePercentile: "50ema",
    }),
  });
