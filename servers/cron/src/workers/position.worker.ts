import z from "zod";
import { cpus } from "os";
import type { Logger } from "pino";
import { type Job, Worker } from "bullmq";
import { createSolanaRpc } from "@solana/kit";
import type { Connection } from "@solana/web3.js";
import type { Database } from "@rhiva-ag/datasource";
import type Coingecko from "@coingecko/coingecko-typescript";

import { Work } from "../constants";
import { createRedis } from "../instances";
import { syncOrcaPositionsForWallet } from "../controllers/sync/orca";
import { syncRaydiumPositionsForWallet } from "../controllers/sync/raydium";
import { syncMeteoraPositionsForWallet } from "../controllers/sync/meteora";

export const positionWorkSchema = z.object({
  wallet: z.object({
    id: z.string(),
    key: z.string(),
  }),
  dex: z.enum(["meteora", "orca", "raydium-clmm"]),
});

export default async function createWorker({
  db,
  logger,
  coingecko,
  solanaConnection,
}: {
  coingecko: Coingecko;
  db: Database;
  logger: Logger;
  solanaConnection: Connection;
}) {
  const worker = new Worker(
    Work.syncPosition,
    async ({ data }: Job<z.infer<typeof positionWorkSchema>>) => {
      logger.info({ data }, "position.sync.worker");
      const result = positionWorkSchema.safeParse(data);

      if (result.success)
        switch (data.dex) {
          case "orca": {
            const rpc = createSolanaRpc(solanaConnection.rpcEndpoint);
            return syncOrcaPositionsForWallet(rpc, coingecko, db, data.wallet);
          }
          case "meteora":
            return syncMeteoraPositionsForWallet(
              db,
              solanaConnection,
              coingecko,
              data.wallet,
            );
          case "raydium-clmm":
            return syncRaydiumPositionsForWallet(
              db,
              solanaConnection,
              coingecko,
              data.wallet,
            );
        }

      logger.error(
        { data, error: "Invalid job payload" },
        "worker.position.sync.error",
      );
    },
    {
      concurrency: cpus().length,
      connection: createRedis({ maxRetriesPerRequest: null }),
    },
  );

  worker.on("failed", (job, error) => {
    console.error(error);
    logger.error(
      { error, job: { id: job?.id, data: job?.data } },
      "worker.position.sync.failed",
    );
  });
  worker.on("error", (error) => {
    logger.error({ error }, "worker.position.sync.error");
  });

  if (!worker.isRunning()) await worker.run();

  return async () => {
    await worker.close();
    await worker.disconnect();
  };
}
