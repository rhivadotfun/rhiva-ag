import type z from "zod";
import { Queue } from "bullmq";
import { type transactionWorkSchema, Work } from "@rhiva-ag/cron";

import { createRedis } from "../../instances";

export const createQueue = () =>
  new Queue<z.infer<typeof transactionWorkSchema>>(Work.syncTransaction, {
    connection: createRedis(),
  });
