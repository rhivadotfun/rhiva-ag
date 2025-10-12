import z from "zod";
import { pnlSelectSchema, whereOperator } from "@rhiva-ag/datasource";

export const pnlFilterSchema = z.object({
  position: whereOperator(pnlSelectSchema.shape.position),
  createdAt: whereOperator(pnlSelectSchema.shape.createdAt),
});
