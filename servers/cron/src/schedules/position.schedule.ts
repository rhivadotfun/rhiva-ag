import { format } from "util";
import type { Logger } from "pino";
import { Queue, Worker } from "bullmq";
import type { Database } from "@rhiva-ag/datasource";

import { createRedis } from "../instances";
import { supportedDex, Work } from "../constants";

export default async function createSchedule({
  db,
  logger,
}: {
  db: Database;
  logger: Logger;
}) {
  const syncQueue = new Queue(Work.syncPosition, {
    connection: createRedis(),
  });
  const scheduleQueue = new Queue(Work.syncPositionSchedule, {
    connection: createRedis(),
  });

  const syncPositionSchedule = async () => {
    logger.info("position.sync.schedule");
    const wallets = await db.query.wallets.findMany({
      columns: {
        id: true,
        key: true,
      },
    });

    if (wallets.length < 1)
      return logger.info("worker.position.schedule.empty");

    await Promise.all(
      wallets.flatMap((wallet) =>
        supportedDex.map((dex) =>
          syncQueue.add(
            Work.syncPosition,
            { dex, wallet },
            { jobId: format("%s/%s", dex, wallet.id), removeOnComplete: true },
          ),
        ),
      ),
    );
  };

  const worker = new Worker(
    Work.syncPositionSchedule,
    async () => syncPositionSchedule(),
    {
      connection: createRedis({ maxRetriesPerRequest: null }),
    },
  );

  // run now
  await syncPositionSchedule();

  worker.on("failed", (job, error) => {
    console.error(error);
    logger.error(
      { error, job: { id: job?.id, data: job?.data } },
      "worker.position.schedule.failed",
    );
  });

  worker.on("error", (error) => {
    logger.error({ error }, "worker.position.schedule.error");
  });

  if (!worker.isRunning()) await worker.run();

  scheduleQueue.add(
    Work.syncPositionSchedule,
    {},
    {
      removeOnFail: true,
      removeOnComplete: true,
      repeat: { every: 60_000 },
    },
  );

  return async () => {
    await worker.close();
    await syncQueue.close();
    await scheduleQueue.close();

    await worker.disconnect();
    await syncQueue.disconnect();
    await scheduleQueue.disconnect();
  };
}
