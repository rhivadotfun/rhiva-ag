import type z from "zod";
import type {
  userSelectSchema,
  walletSelectSchema,
} from "@rhiva-ag/datasource";

export type User = Omit<
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
