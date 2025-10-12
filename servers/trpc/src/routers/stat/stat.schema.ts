import z from "zod";

export const honkIndexSchema = z.object({
  yield: z.number(),
  volume: z.number(),
  activePools: z.number(),
});
