import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import type { User } from "./controllers/types";
import { JWTAuthMiddleware } from "./controllers/jwt-auth.controller";
import {
  drizzle,
  mcpClient,
  secret,
  coingecko,
  solanatracker,
  sendTransaction,
  solanaConnection,
  createRedis,
} from "./instances";

const redis = createRedis();
const authMiddlewares = [
  new JWTAuthMiddleware(redis, secret, drizzle, {
    ttl: 86400,
  }),
];

export const createContext = async ({ req }: CreateFastifyContextOptions) => {
  let user: User | null | undefined;

  for (const authMiddleware of authMiddlewares) {
    user = await authMiddleware.getUser(req);
    if (user) break;
  }

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
