import createPositionWorker from "./position.worker";
import { db, secret, logger, coingecko, solanaConnection } from "../instances";

(async () => {
  const stopPositionWorker = await createPositionWorker({
    db,
    secret,
    logger,
    coingecko,
    solanaConnection,
  });

  const shutdown = async () => {
    await stopPositionWorker();
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
