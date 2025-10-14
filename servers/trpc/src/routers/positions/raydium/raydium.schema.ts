import z from "zod";
import { address, publicKey } from "@rhiva-ag/datasource";

export const raydiumCreatePositionSchema = z.object({
  pair: publicKey(),
  slippage: z.number(),
  inputAmount: z.number(),
  inputMint: publicKey(),
  priceChanges: z.tuple([z.number(), z.number()]),
});

export const raydiumClosePositionSchema = z.object({
  pair: address(),
  slippage: z.number(),
  position: publicKey(),
});
