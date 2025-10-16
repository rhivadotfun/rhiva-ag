import type z from "zod";
import { desc, eq } from "drizzle-orm";
import {
  pnls,
  wallets,
  type walletSelectSchema,
  type Database,
  positions,
} from "@rhiva-ag/datasource";

export const getUserPositions = async (
  db: Database,
  wallet: z.infer<typeof walletSelectSchema>["id"],
) => {
  return db.query.positions.findMany({
    with: {
      pnls: {
        orderBy: pnls.createdAt,
      },
      pool: {
        columns: {
          id: true,
        },
        with: {
          baseToken: {
            columns: {
              id: true,
              decimals: true,
              tokenProgram: true,
            },
          },
        },
      },
    },
    columns: {
      pool: false,
    },
    where: eq(wallets.id, wallet),
    orderBy: desc(positions.createdAt),
  });
};
