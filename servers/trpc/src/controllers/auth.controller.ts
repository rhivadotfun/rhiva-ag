import type z from "zod";
import { format } from "util";
import type Redis from "ioredis";
import { eq } from "drizzle-orm";
import { Keypair } from "@solana/web3.js";
import { verify } from "@civic/auth-verify";
import type { FastifyRequest } from "fastify";
import { KMSSecret, type Secret } from "@rhiva-ag/shared";
import {
  type userInsertSchema,
  users,
  type Database,
  type userSelectSchema,
  wallets,
  settings,
  type walletSelectSchema,
} from "@rhiva-ag/datasource";

import { getEnv } from "../env";

type User = Omit<
  z.infer<typeof userSelectSchema>,
  | "referXp"
  | "totalRefer"
  | "settings"
  | "xp"
  | "wallet"
  | "todayXp"
  | "totalUsers"
  | "rank"
> & { wallet: z.infer<typeof walletSelectSchema> };

export class CivicAuthMiddleware {
  constructor(
    private readonly redis: Redis,
    private readonly secret: KMSSecret | Secret,
    private readonly drizzle: Database,
    private readonly options?: {
      ttl?: number;
    },
  ) {}

  private getCacheUserKey(sessionId: string) {
    return format("%s:user", sessionId);
  }
  private async upsertUser(values: z.infer<typeof userInsertSchema>) {
    const user = await this.drizzle.query.users.findFirst({
      with: {
        wallet: true,
      },
      where: eq(users.uid, values.uid),
    });
    if (user) return user;

    const [createdUser] = await this.drizzle
      .insert(users)
      .values(values)
      .onConflictDoNothing()
      .returning();
    if (createdUser) {
      const keypair = Keypair.generate();
      let wrappedDek: string, encryptedText: string;

      if (this.secret instanceof KMSSecret) {
        const { wrappedDek: dek, encryptedText: key } =
          await this.secret.encrypt(keypair.secretKey.toBase64());
        wrappedDek = dek;
        encryptedText = key;
      } else encryptedText = this.secret.encrypt(keypair.secretKey.toBase64());
      await this.drizzle.transaction(async (db) => {
        return Promise.all([
          db
            .insert(settings)
            .values({
              user: createdUser.id,
            })
            .onConflictDoNothing({ target: [settings.user] }),
          db
            .insert(wallets)
            .values({
              wrappedDek,
              key: encryptedText,
              user: createdUser.id,
              id: keypair.publicKey.toBase58(),
            })
            .onConflictDoNothing({ target: [wallets.user] }),
        ]);
      });
    }

    return this.drizzle.query.users.findFirst({
      with: {
        wallet: true,
      },
      where: eq(users.uid, values.uid),
    });
  }

  async getUser(request: FastifyRequest): Promise<User | undefined | null> {
    const sessionUser = await this.getUserFromSession(request);
    if (sessionUser) return sessionUser;
    return this.getUserFromHeader(request);
  }

  private async getUserFromSession(
    request: FastifyRequest,
  ): Promise<User | null> {
    const sessionId = request.session.sessionId;
    const key = this.getCacheUserKey(sessionId);
    const user = await this.redis.get(key);
    if (user) return JSON.parse(user);
    return null;
  }

  private async getUserFromHeader(request: FastifyRequest) {
    const authorization = request.headers.authorization;
    if (authorization) {
      const [, token] = authorization.split(/\s/g);
      const payload = await verify(token!, {
        clientId: getEnv("CIVIC_CLIENT_ID"),
      });

      if (payload.sub) {
        const user = await this.upsertUser({
          uid: payload.sub,
          email: payload.email as string,
          displayName: payload.name as string,
        });

        const sessionId = request.session.sessionId;
        const key = this.getCacheUserKey(sessionId);
        if (this.options?.ttl)
          await this.redis.set(
            key,
            JSON.stringify(user),
            "EX",
            this.options?.ttl,
          );
        else await this.redis.set(key, JSON.stringify(user));

        return user;
      }
    }

    return null;
  }
}
