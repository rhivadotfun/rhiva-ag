import { z } from "zod";
import { Worker } from "bullmq";
import type { Logger } from "pino";
import { Pipeline } from "@rhiva-ag/decoder";
import type { Connection, PublicKey } from "@solana/web3.js";
import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import {
  publicKey,
  walletSelectSchema,
  type Database,
} from "@rhiva-ag/datasource";
import type Coingecko from "@coingecko/coingecko-typescript";
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
import { createRedis } from "../instances";

const workSchema = z
  .union([
    z
      .union([
        z.object({
          dex: z.enum(["orca", "meteora"]),
        }),
        z.object({
          positionNftMint: publicKey().optional(),
          dex: z.enum(["raydium-clmm"]),
        }),
      ])
      .and(
        z.object({
          bundleId: z.string(),
          type: z.literal("create-position"),
        }),
      ),
    z.object({
      bundleId: z.string(),
      type: z.literal("close-position"),
      dex: z.enum(["orca", "meteora", "raydium-clmm"]),
    }),
  ])
  .and(
    z.object({
      wallet: walletSelectSchema.pick({ id: true }),
    }),
  );

export const createTransactionPipeline = ({
  db,
  rpc,
  coingecko,
  connection,
  positionNftMint,
  wallet,
}: {
  db: Database;
  rpc: Rpc<SolanaRpcApi>;
  connection: Connection;
  coingecko: Coingecko;
  positionNftMint?: PublicKey;
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id">;
}) =>
  new Pipeline([
    new MeteoraProgramEventProcessor(connection).addConsumer((...args) =>
      syncMeteoraPositionStateFromEvent(
        db,
        connection,
        coingecko,
        wallet,
        ...args,
      ),
    ),
    new RaydiumProgramEventProcessor(connection).addConsumer((...args) =>
      syncRaydiumPositionStateFromEvent(
        db,
        connection,
        coingecko,
        wallet,
        positionNftMint,
        ...args,
      ),
    ),
    new WhirlpoolProgramEventProcessor(connection).addConsumer((...args) =>
      syncOrcaPositionStateFromEvent(db, rpc, coingecko, wallet, ...args),
    ),
    new MeteoraProgramInstructionEventProcessor(connection).addConsumer(
      (instructions, extra) =>
        syncMeteoraPositionStateFromEvent(
          db,
          connection,
          coingecko,
          wallet,
          instructions.map((instruction) => instruction.parsed),
          extra,
        ),
    ),
    new RaydiumProgramInstructionEventProcessor(connection).addConsumer(
      (instructions, extra) =>
        syncRaydiumPositionStateFromEvent(
          db,
          connection,
          coingecko,
          wallet,
          positionNftMint,
          instructions.map((instruction) => instruction.parsed),
          extra,
        ),
    ),
    new WhirlpoolProgramInstructionEventProcessor(connection).addConsumer(
      (instructions, extra) =>
        syncOrcaPositionStateFromEvent(
          db,
          rpc,
          coingecko,
          wallet,
          instructions.map((instruction) => instruction.parsed),
          extra,
        ),
    ),
  ]);

export default async function createWorker({
  db,
  logger,
  sender,
  coingecko,
  connection,
}: {
  db: Database;
  logger: Logger;
  coingecko: Coingecko;
  connection: Connection;
  sender: SendTransaction;
}) {
  const rpc = createSolanaRpc(connection.rpcEndpoint);
  const worker = new Worker<z.infer<typeof workSchema>>(
    Work.syncTransaction,
    async ({ data }) => {
      const result = workSchema.safeParse(data);

      if (result.success) {
        const pipeline = createTransactionPipeline({
          db,
          rpc,
          connection,
          coingecko,
          wallet: data.wallet,
          positionNftMint:
            "positionNftMint" in data ? data.positionNftMint : undefined,
        });

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
    {
      connection: createRedis({ maxRetriesPerRequest: null }),
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
