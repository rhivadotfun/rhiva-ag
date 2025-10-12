/**  biome-ignore-all lint/correctness/noUnusedImports: global types inferred **/
import { FastifyRequest } from "fastify";
import { fastifyCookie } from "@fastify/cookie";
import { fastifySession } from "@fastify/session";

declare module "fastify" {
  interface Session {
    id: string;
  }
}
