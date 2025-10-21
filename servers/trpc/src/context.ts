import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { CivicAuthMiddleware } from "./controllers/auth.controller";
import {
  redis,
  secret,
  drizzle,
  mcpClient,
  coingecko,
  solanatracker,
  sendTransaction,
  solanaConnection,
} from "./instances";

const authMiddleware = new CivicAuthMiddleware(redis, secret, drizzle, {
  ttl: 86400,
});

export const createContext = async ({ req }: CreateFastifyContextOptions) => {
  const user = await authMiddleware.getUser(req);

  return {
    user,
    redis,
    secret,
    drizzle,
    coingecko,
    mcpClient,
    solanatracker,
    sendTransaction,
    connection: solanaConnection,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
