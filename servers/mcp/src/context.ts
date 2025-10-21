import type z from "zod";
import type { Database, userSelectSchema } from "@rhiva-ag/datasource";

export type AgentContext = {
  db: Database;
  user: Pick<
    z.infer<typeof userSelectSchema>,
    "id" | "displayName" | "settings" | "wallet"
  >;
};
