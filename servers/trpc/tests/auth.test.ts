import type z from "zod";
import crypto from "crypto";
import { format } from "util";
import { eq } from "drizzle-orm";
import Redis from "ioredis-mock";
import { Keypair } from "@solana/web3.js";
import { Secret } from "@rhiva-ag/shared";
import type { FastifyRequest } from "fastify";
import type { verify } from "@civic/auth-verify";
import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import {
  createDB,
  users,
  type userSelectSchema,
  type Database,
  wallets,
} from "@rhiva-ag/datasource";

import { getEnv } from "../src/env";
import { CivicAuthMiddleware } from "../src/controllers/auth.controller";

describe("auth controller", () => {
  let db: Database;
  let secret: Secret;
  let redis: InstanceType<typeof Redis>;
  let controller: CivicAuthMiddleware;
  const testUser: Awaited<ReturnType<typeof verify>> = {
    name: "Test User",
    sub: crypto.randomUUID(),
    email: "test@email.com",
  };

  beforeAll(() => {
    db = createDB(getEnv("DATABASE_URL"));
    redis = new Redis();
    secret = new Secret(crypto.randomBytes(32).toHex(), {
      ivLength: 12,
      algorithm: "aes-256-gcm",
    });
    controller = new CivicAuthMiddleware(redis, secret, db, { ttl: 60 });
  });

  afterAll(() => {
    db.delete(users).where(eq(users.id, testUser.sub!));
  });

  mock.module("@civic/auth-verify", () => ({
    verify: () => testUser,
  }));

  test("auth controller test", async () => {
    const request = {
      headers: {
        authorization: "Bearer fake_token",
      },
      session: { sessionId: crypto.randomUUID() },
    } as unknown as FastifyRequest;

    const user = await controller.getUser(request);
    expect(user).toBeTruthy();
    expect(user?.email).toBe(testUser.email as string);
    expect(user?.displayName).toBe(testUser.name as string);

    const cache = await redis.get(format("%s:user", request.session.sessionId));
    expect(cache).toBeTruthy();
    const loadUser: z.infer<typeof userSelectSchema> = JSON.parse(cache!);
    expect(loadUser.email).toBe(testUser.email as string);
    expect(loadUser.displayName).toBe(testUser.name as string);

    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.user, user!.id),
    });

    expect(wallet).toBeTruthy();
    const decryptWallet = Keypair.fromSecretKey(
      Buffer.from(secret.decrypt<string>(wallet!.key), "base64"),
    );

    expect(decryptWallet.publicKey.toBase58()).toBe(wallet!.id);
  });
});
