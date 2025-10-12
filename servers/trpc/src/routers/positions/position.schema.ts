import z from "zod";
import {
  orderByOperator,
  positionSelectSchema,
  whereOperator,
} from "@rhiva-ag/datasource";

export const positionFilterSchema = z.object({
  state: whereOperator(positionSelectSchema.shape.state),
  status: whereOperator(positionSelectSchema.shape.status),
});

export const positionSortSchema = orderByOperator(
  z.enum(["createdAt", "amountUsd"]),
);
