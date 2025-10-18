import z from "zod";
import { publicKey } from "@rhiva-ag/datasource";
import { jitoTipConfigSchema } from "../position.schema";

export const raydiumCreatePositionSchema = z
  .object({
    pair: publicKey(),
    slippage: z.number(),
    inputAmount: z.number(),
    inputMint: publicKey(),
    priceChanges: z.tuple([z.number(), z.number()]),
  })
  .extend({
    jitoConfig: jitoTipConfigSchema.default({
      type: "dynamic",
      priorityFeePercentile: "50ema",
    }),
  });

export const raydiumClosePositionSchema = z
  .object({
    pair: publicKey(),
    slippage: z.number(),
    position: publicKey(),
  })
  .extend({
    jitoConfig: jitoTipConfigSchema.default({
      type: "dynamic",
      priorityFeePercentile: "50ema",
    }),
  });
