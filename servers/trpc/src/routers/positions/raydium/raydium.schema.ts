import z from "zod";
import { publicKey } from "@rhiva-ag/datasource";
import { jitoTipConfigSchema } from "../position.schema";

export const raydiumCreatePositionSchema = z
  .object({
    pair: publicKey().describe("pool address"),
    slippage: z.number().describe("swap slippage"),
    inputAmount: z.number().describe("input amount"),
    inputMint: publicKey().describe("input amount mint"),
    priceChanges: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  })
  .extend({
    jitoConfig: jitoTipConfigSchema
      .default({
        type: "dynamic",
        priorityFeePercentile: "50ema",
      })
      .optional(),
  });

export const raydiumClosePositionSchema = z
  .object({
    pair: publicKey().describe("pool address"),
    slippage: z.number().describe("swap slippage"),
    position: publicKey().describe("position address"),
  })
  .extend({
    jitoConfig: jitoTipConfigSchema
      .default({
        type: "dynamic",
        priorityFeePercentile: "50ema",
      })
      .optional(),
  });
