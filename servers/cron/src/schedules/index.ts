import { db, logger } from "../instances";
import createPositionSyncScheduleWorker from "./position.schedule";

(async () => {
  const stopPositionSyncScheduleWorker = await createPositionSyncScheduleWorker(
    {
      db,
      logger,
    },
  );

  const shutdown = async () => {
    await stopPositionSyncScheduleWorker();
    process.exit();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (error) =>
    logger.error({ error }, "Uncaught Exception"),
  );
  process.on("unhandledRejection", (reason) =>
    logger.error({ reason }, "Unhandled Promise Rejection"),
  );
})();
