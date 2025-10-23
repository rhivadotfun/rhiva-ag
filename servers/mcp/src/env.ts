import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
import { format } from "util";
import { execSync } from "child_process";

if (process.env.NODE_ENV !== "production") {
  const root = execSync("git rev-parse --show-toplevel").toString().trim();
  dotenv.config({ path: path.resolve(root, ".env") });
  dotenv.config(); // local .env file have more priority than global .env file
}

type Env =
  | "PORT"
  | "HOST"
  | "REDIS_MASTER_NAME"
  | "REDIS_MAX_SENTINELS"
  | "REDIS_SENTINEL_PORT"
  | "REDIS_URL"
  | "REDIS_SENTINEL_HOSTNAME"
  | "DATABASE_URL"
  | "COINGECKO_API_KEY"
  | "CIVIC_CLIENT_ID"
  | "JITO_API_URL"
  | "JITO_UUID"
  | "HELIUS_API_URL"
  | "HELIUS_API_KEY"
  | "SECRET_KEY"
  | "SOLANA_RPC_URL";

export const getEnv = <T>(name: Env, refine?: <K>(value: K) => T): T => {
  const value = process.env[name] || process.env[format("APP_%s", name)];
  if (value)
    try {
      const parsed = JSON.parse(value) as T;
      return refine ? (refine(parsed) as T) : parsed;
    } catch {
      return (refine ? refine(value) : value) as T;
    }
  throw new Error(format("%s not found in env file", name));
};
