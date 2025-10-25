import z from "zod";
import jwt from "jsonwebtoken";
import { getAuth } from "firebase-admin/auth";
import { createDB } from "@rhiva-ag/datasource";
import { SigninMessage } from "@rhiva-ag/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { getEnv } from "../../env";
import { kmsSecret } from "../../instances";
import { AuthMiddleware } from "../../controllers/auth.controller";
import { firebaseTokenAuthSchema, walletAuthSchema } from "./auth.schema";
import { extendedUserSelectSchema } from "../../routers/users/user.schema";
import { getUserById } from "../../routers/users/user.controller";

const db = createDB(getEnv("DATABASE_URL"));

export const safeAuthUserSchema = extendedUserSelectSchema.extend({
  token: z.string(),
});

const walletSignInRoute = async (
  request: FastifyRequest<{ Body: z.infer<typeof walletAuthSchema> }>,
  reply: FastifyReply,
) => {
  const data = walletAuthSchema.parse(request.body);
  const signInMessage = new SigninMessage(data.message);
  const isValid = await signInMessage.validate(data.signature);
  if (isValid) {
    const user = await AuthMiddleware.upsertUser(db, kmsSecret, {
      uid: data.message.publicKey,
    });

    if (user) {
      const token = jwt.sign({ user: user.id }, getEnv<string>("SECRET_KEY"), {
        expiresIn: 25200,
      });
      return safeAuthUserSchema.parse({ token, ...user });
    }
  }

  return reply.status(401).send("UNAUTHORIZED");
};

const firebaseTokenSignInRoute = async (
  request: FastifyRequest<{ Body: z.infer<typeof firebaseTokenAuthSchema> }>,
  reply: FastifyReply,
) => {
  const data = firebaseTokenAuthSchema.parse(request.body);
  const auth = getAuth();
  const decodedUser = await auth.verifyIdToken(data.token, true);
  const user = await AuthMiddleware.upsertUser(db, kmsSecret, {
    uid: decodedUser.uid,
    email: decodedUser.email,
  });

  if (user) {
    const extendedUser = await getUserById(db, user.id);
    const token = jwt.sign({ user: user.id }, getEnv<string>("SECRET_KEY"), {
      expiresIn: 25200,
    });
    return safeAuthUserSchema.parse({ token, ...extendedUser });
  }

  return reply.status(401).send("UNAUTHORIZED");
};

export default function registerAuthRoutes(fastify: FastifyInstance) {
  fastify
    .route({
      method: "POST",
      url: "/auth/wallet",
      handler: walletSignInRoute,
    })
    .route({
      method: "POST",
      url: "/auth/firebase",
      handler: firebaseTokenSignInRoute,
    });
}
