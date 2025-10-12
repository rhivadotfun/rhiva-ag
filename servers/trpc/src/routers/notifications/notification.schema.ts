import z from "zod";
import {
  notificationSelectSchema,
  orderByOperator,
  whereOperator,
} from "@rhiva-ag/datasource";

export const notificationFilterSchema = z.object({
  type: whereOperator(notificationSelectSchema.shape.type),
});

export const notificationSortSchema = orderByOperator(z.enum(["createdAt"]));
