import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { CivicAuthMiddleware } from "./controllers/auth.controller";
import { coingecko, drizzle, redis, secret, solanatracker } from "./instances";

const authMiddleware = new CivicAuthMiddleware(redis, secret, drizzle, {
  ttl: 86400,
});

export const createContext = async ({ req }: CreateFastifyContextOptions) => {
  const user = await authMiddleware.getUser(req);

  return {
    user,
    redis,
    secret,
    coingecko,
    drizzle,
    solanatracker,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
