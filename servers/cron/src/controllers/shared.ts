import { eq } from "drizzle-orm";
import { type Database, pools, positions } from "@rhiva-ag/datasource";

export const getPoolById = async (
  db: Database,
  id: (typeof pools.$inferSelect)["id"],
) =>
  await db.query.pools.findFirst({
    columns: {
      baseToken: false,
      quoteToken: false,
    },
    with: {
      baseToken: {
        columns: {
          id: true,
          symbol: true,
          decimals: true,
        },
      },
      quoteToken: {
        columns: {
          id: true,
          symbol: true,
          decimals: true,
        },
      },
    },
    where: eq(pools.id, id),
  });

export const getPositionById = async (
  db: Database,
  id: (typeof pools.$inferSelect)["id"],
) =>
  await db.query.positions
    .findFirst({
      columns: {
        pool: false,
      },
      with: {
        pool: {
          columns: {
            baseToken: false,
            quoteToken: false,
          },
          with: {
            baseToken: {
              columns: {
                id: true,
                symbol: true,
                decimals: true,
              },
            },
            quoteToken: {
              columns: {
                id: true,
                symbol: true,
                decimals: true,
              },
            },
          },
        },
      },
      where: eq(positions.id, id),
    })
    .execute();
