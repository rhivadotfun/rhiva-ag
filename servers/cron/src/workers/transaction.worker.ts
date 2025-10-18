import { z } from "zod/mini";
import { Worker } from "bullmq";
import type { Logger } from "pino";
import { Pipeline } from "@rhiva-ag/decoder";
import type { Connection } from "@solana/web3.js";
import { mapFilter, type SendTransaction } from "@rhiva-ag/shared";
import {
  RaydiumProgramEventProcessor,
  RaydiumProgramInstructionEventProcessor,
} from "@rhiva-ag/decoder/programs/raydium/index";
import {
  WhirlpoolProgramEventProcessor,
  WhirlpoolProgramInstructionEventProcessor,
} from "@rhiva-ag/decoder/programs/orca/index";
import {
  MeteoraProgramEventProcessor,
  MeteoraProgramInstructionEventProcessor,
} from "@rhiva-ag/decoder/programs/meteora/index";

import { Work } from "../constants";
import { syncOrcaPositionStateFromEvent } from "../controllers/sync/orca";
import { syncRaydiumPositionStateFromEvent } from "../controllers/sync/raydium";
import { syncMeteoraPositionStateFromEvent } from "../controllers/sync/meteora";

const workSchema = z.union([
  z.object({
    bundleId: z.string(),
    type: z.literal("create-position"),
    dex: z.enum(["orca", "meteora", "raydium-clmm"]),
  }),
  z.object({
    bundleId: z.string(),
    type: z.literal("close-position"),
    dex: z.enum(["orca", "meteora", "raydium-clmm"]),
  }),
]);

export default async function createWorker(
  connection: Connection,
  sender: SendTransaction,
  logger: Logger,
) {
  const pipeline = new Pipeline([
    new MeteoraProgramEventProcessor(connection).addConsumer(
      syncMeteoraPositionStateFromEvent,
    ),
    new RaydiumProgramEventProcessor(connection).addConsumer(
      syncRaydiumPositionStateFromEvent,
    ),
    new WhirlpoolProgramEventProcessor(connection).addConsumer(
      syncOrcaPositionStateFromEvent,
    ),
    new MeteoraProgramInstructionEventProcessor(connection).addConsumer(
      (instructions) =>
        syncMeteoraPositionStateFromEvent(
          instructions.map((instruction) => instruction.parsed),
        ),
    ),
    new RaydiumProgramInstructionEventProcessor(connection).addConsumer(
      (instructions) =>
        syncRaydiumPositionStateFromEvent(
          instructions.map((instruction) => instruction.parsed),
        ),
    ),
    new WhirlpoolProgramInstructionEventProcessor(connection).addConsumer(
      (instructions) =>
        syncOrcaPositionStateFromEvent(
          instructions.map((instruction) => instruction.parsed),
        ),
    ),
  ]);

  const worker = new Worker<z.infer<typeof workSchema>>(
    Work.syncTransaction,
    async ({ data }) => {
      const result = workSchema.safeParse(data);

      if (result.success) {
        const {
          result: { value },
        } = await sender.getBundleStatuses(data.bundleId);
        if (value) {
          if (value.err) throw value.err;

          const response = mapFilter(
            await connection.getParsedTransactions(value.transactions),
            (transaction) => transaction,
          );

          return pipeline.process(...response);
        }

        return Promise.reject(new Error("bundle not found."));
      }

      logger.error(
        { data, error: "Invalid job payload" },
        "worker.transaction.sync.error",
      );
    },
  );

  worker.on("failed", (job, error) => {
    logger.error(
      { error, job: { id: job?.id, data: job?.data } },
      "worker.transaction.sync.failed",
    );
  });
  worker.on("error", (error) => {
    logger.error({ error }, "worker.transaction.sync.error");
  });

  if (!worker.isRunning()) await worker.run();

  return async () => {
    await worker.close();
    await worker.disconnect();
  };
}
