import type { FastifyInstance } from "fastify";
import registerAuthRoutes from "./auth/auth.route";

export default function registerRoutes(fastify: FastifyInstance) {
  registerAuthRoutes(fastify);
}
