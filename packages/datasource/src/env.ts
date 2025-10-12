import "dotenv/config";

import { format } from "util";

type Env =
  | "REDIS_MAX_SENTINELS"
  | "REDIS_SENTINEL_PORT"
  | "REDIS_SENTINEL_HOSTNAME"
  | "REDIS_URL"
  | "COINGECKO_API_KEY"
  | "SOLANA_TRACKER_API_KEY"
  | "DATABASE_URL";

export const getEnv = <T>(name: Env, refine?: <K>(value: K) => T): T => {
  const value = process.env[format("APP_%s", name)] || process.env[name];
  if (value)
    try {
      const parsed = JSON.parse(value) as T;
      return refine ? (refine(parsed) as T) : parsed;
    } catch {
      return (refine ? refine(value) : value) as T;
    }
  throw new Error(format("%s not found in env file", name));
};
