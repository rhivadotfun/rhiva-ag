import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyWebsocket from "@fastify/websocket";
import fastifyRateLimit from "@fastify/rate-limit";
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";

import { getEnv } from "./env";
import { redis } from "./instances";
import { createContext } from "./context";
import { appRouter, type AppRouter } from "./routers";

const server = fastify({
  logger: true,
  maxParamLength: 5000,
});

server.register(fastifyCookie);
server.register(fastifySession, { secret: getEnv<string>("SECRET_KEY") });
server.register(fastifyWebsocket);
server.register(fastifyCors, {
  credentials: true,
  origin: [
    /^http?:\/\/localhost(:\d+)?$/,
    /^http?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https?:\/\/([a-z0-9-]+\.)*rhiva\.fun$/,
    /^https?:\/\/([a-z0-9-]+\.)*oasis-mystre\.workers\.dev$/,
  ],
});
server.register(fastifyRateLimit, { redis });
server.register(fastifyTRPCPlugin, {
  prefix: "/",
  useWSS: true,
  trpcOptions: {
    createContext,
    router: appRouter,
    onError({ path, error }) {
      server.log.error(error, path);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

server.listen({
  host: getEnv("HOST"),
  port: getEnv("PORT", Number),
});

const stop = async () => {
  await server.close();
  process.exit(0);
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("uncaughtException", (err) =>
  server.log.error(err, "Uncaught exception"),
);
process.on("unhandledRejection", (reason, promise) =>
  server.log.error({ promise, reason }, "Unhandled Rejection"),
);
