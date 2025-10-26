import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { positions, positionSelectSchema } from "@rhiva-ag/datasource";

import { privateProcedure, router } from "../../../trpc";
import { getMeteoraPositionPnLById } from "./meteora.controller";

export const meteoraRoute = router({
  get: privateProcedure
    .input(positionSelectSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      const position = await ctx.drizzle.query.positions.findFirst({
        where: eq(positions.id, input.id),
        with: {
          pool: {
            columns: {
              id: true,
              baseToken: false,
              quoteToken: false,
            },
            with: {
              baseToken: {
                columns: {
                  id: true,
                  decimals: true,
                },
              },
              quoteToken: {
                columns: {
                  id: true,
                  decimals: true,
                },
              },
            },
          },
        },
      });
      if (position)
        return getMeteoraPositionPnLById(
          ctx.coingecko,
          ctx.connection,
          position,
        );

      throw new TRPCError({ code: "NOT_FOUND", message: "position not found" });
    }),
});
