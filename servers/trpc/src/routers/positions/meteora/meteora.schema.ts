import z from "zod";
import { StrategyType } from "@meteora-ag/dlmm";
import { publicKey } from "@rhiva-ag/datasource";
import { jitoTipConfigSchema } from "../position.schema";

export const meteoraCreatePositionSchema = z
  .object({
    pair: publicKey(),
    slippage: z.number(),
    inputAmount: z.number(),
    inputMint: publicKey(),
    strategyType: z
      .enum(["Spot", "Curve", "BidAsk"])
      .transform((value) => StrategyType[value]),
    sides: z.array(publicKey()).min(1).max(2),
    priceChanges: z.tuple([z.number(), z.number()]),
    liquidityRatio: z.tuple([z.number(), z.number()]).optional(),
  })
  .extend({
    jitoConfig: jitoTipConfigSchema.default({
      type: "dynamic",
      priorityFeePercentile: "50ema",
    }),
  });

export const meteoraClosePositionSchema = z
  .object({
    pair: publicKey(),
    position: publicKey(),
    slippage: z.number(),
  })
  .extend({
    jitoConfig: jitoTipConfigSchema.default({
      type: "dynamic",
      priorityFeePercentile: "50ema",
    }),
  });
