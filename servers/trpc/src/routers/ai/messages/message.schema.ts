import z from "zod";
import {
  threadSelectSchema,
  whereOperator,
  orderByOperator,
} from "@rhiva-ag/datasource";

export const messageFilterSchema = z.object({
  thread: whereOperator(threadSelectSchema.shape.id),
});

export const messageSortSchema = orderByOperator(z.enum(["createdAt"]));
