import "dotenv/config";

import { format } from "util";

type Env =
  | "JITO_API_URL"
  | "JITO_UUID"
  | "HELIUS_API_URL"
  | "HELIUS_API_KEY"
  | "SOLANA_RPC_URL"
  | "DEV_WALLET";

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
