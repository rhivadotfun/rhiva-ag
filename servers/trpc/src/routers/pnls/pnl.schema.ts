import z from "zod";

export const pnlFilterSchema = z.object({
  start: z.date(),
  end: z.date(),
});
