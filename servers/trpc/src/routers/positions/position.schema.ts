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

export const jitoTipConfigSchema = z.union([
  z.object({ type: z.literal("exact"), amountLamport: z.bigint() }),
  z.object({
    type: z.literal("dynamic"),
    priorityFeePercentile: z.enum(["25", "50", "75", "95", "99", "50ema"]),
  }),
]);
