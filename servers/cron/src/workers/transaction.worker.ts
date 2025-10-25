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
import { createRedis } from "../instances";
import { syncOrcaPositionStateFromEvent } from "../controllers/sync/orca";
import { syncRaydiumPositionStateFromEvent } from "../controllers/sync/raydium";
import { syncMeteoraPositionStateFromEvent } from "../controllers/sync/meteora";

export const transactionWorkSchema = z
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
      wallet: walletSelectSchema.pick({ id: true, user: true }),
    }),
  );

export const createTransactionPipeline = ({
  db,
  rpc,
  type,
  wallet,
  coingecko,
  connection,
  positionNftMint,
}: {
  db: Database;
  coingecko: Coingecko;
  rpc: Rpc<SolanaRpcApi>;
  connection: Connection;
  positionNftMint?: PublicKey;
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id" | "user">;
  type?: "closed-position" | "create-position" | "claim-reward";
}) =>
  new Pipeline([
    new MeteoraProgramEventProcessor(connection).addConsumer((events, extra) =>
      syncMeteoraPositionStateFromEvent({
        db,
        type,
        extra,
        events,
        wallet,
        coingecko,
        connection,
      }),
    ),
    new RaydiumProgramEventProcessor(connection).addConsumer((events, extra) =>
      syncRaydiumPositionStateFromEvent({
        db,
        type,
        extra,
        events,
        wallet,
        coingecko,
        connection,
        positionNftMint,
      }),
    ),
    new WhirlpoolProgramEventProcessor(connection).addConsumer(
      (events, extra) =>
        syncOrcaPositionStateFromEvent({
          db,
          rpc,
          type,
          wallet,
          events,
          extra,
          coingecko,
        }),
    ),
    new MeteoraProgramInstructionEventProcessor(connection).addConsumer(
      (instructions, extra) =>
        syncMeteoraPositionStateFromEvent({
          db,
          type,
          extra,
          wallet,
          coingecko,
          connection,
          events: instructions.map((instruction) => instruction.parsed),
        }),
    ),
    new RaydiumProgramInstructionEventProcessor(connection).addConsumer(
      (instructions, extra) =>
        syncRaydiumPositionStateFromEvent({
          db,
          type,
          extra,
          wallet,
          coingecko,
          connection,
          positionNftMint,
          events: instructions.map((instruction) => instruction.parsed),
        }),
    ),
    new WhirlpoolProgramInstructionEventProcessor(connection).addConsumer(
      (instructions, extra) =>
        syncOrcaPositionStateFromEvent({
          db,
          rpc,
          type,
          extra,
          wallet,
          coingecko,
          events: instructions.map((instruction) => instruction.parsed),
        }),
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
  const worker = new Worker<z.infer<typeof transactionWorkSchema>>(
    Work.syncTransaction,
    async ({ data }) => {
      const result = transactionWorkSchema.safeParse(data);

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

        const bundles = await sender.getBundles(data.bundleId);

        return Promise.all(
          bundles.map(async (bundle) => {
            const response = mapFilter(
              await connection.getParsedTransactions(bundle.txSignatures, {
                maxSupportedTransactionVersion: 0,
              }),
              (transaction) => transaction,
            );

            return pipeline.process(...response);
          }),
        );
      }
    },
    {
      connection: createRedis({ maxRetriesPerRequest: null }),
    },
  );

  worker.on("failed", (job, error) => {
    console.error(error);
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
