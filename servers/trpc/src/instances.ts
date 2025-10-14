import type Redis from "ioredis";
import { Connection } from "@solana/web3.js";
import { Client } from "@solana-tracker/data-api";
import Coingecko from "@coingecko/coingecko-typescript";
import { Secret, SendTransaction } from "@rhiva-ag/shared";
import { createDB, createRedis } from "@rhiva-ag/datasource";

import { getEnv } from "./env";

export const secret = new Secret(getEnv("SECRET_KEY"), {
  ivLength: 12,
  algorithm: "aes-256-gcm",
});
export const drizzle = createDB(getEnv("DATABASE_URL"));
export const solanaConnection = new Connection(getEnv("SOLANA_RPC_URL"));
export const sendTransaction = new SendTransaction(
  getEnv("HELIUS_API_URL"),
  getEnv("HELIUS_API_KEY"),
  getEnv("JITO_API_URL"),
  getEnv("JITO_UUID"),
);

export const coingecko = new Coingecko({
  environment: "pro",
  proAPIKey: getEnv("COINGECKO_API_KEY"),
});

export const solanatracker = new Client({
  apiKey: getEnv("SOLANA_TRACKER_API_KEY"),
});

let redis: Redis;

if (process.env.NODE_ENV === "production")
  redis = createRedis({
    name: getEnv("REDIS_MASTER_NAME"),
    max: getEnv("REDIS_MAX_SENTINELS", Number),
    port: getEnv("REDIS_SENTINEL_PORT", Number),
    host: getEnv("REDIS_SENTINEL_HOSTNAME"),
  });
else redis = createRedis(getEnv("REDIS_URL"));

export { redis };
