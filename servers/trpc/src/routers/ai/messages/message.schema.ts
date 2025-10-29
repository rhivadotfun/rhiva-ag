import z from "zod";
import {
  threadSelectSchema,
  whereOperator,
  orderByOperator,
} from "@rhiva-ag/datasource";

import { agentOutputSchema } from "./agent.schema-patch";

export const messageFilterSchema = z.object({
  thread: whereOperator(threadSelectSchema.shape.id),
});

export const messageSortSchema = orderByOperator(z.enum(["createdAt"]));

export const agentMessageSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  content: agentOutputSchema,
  role: z.enum(["system", "assistant"]),
});
export const userMessageSchema = z.object({
  id: z.string(),

  role: z.literal("user"),
  content: z.object({
    text: z.string(),
  }),
  createdAt: z.date(),
});

export const messageOutputSchema = z.union([
  agentMessageSchema,
  userMessageSchema,
]);
