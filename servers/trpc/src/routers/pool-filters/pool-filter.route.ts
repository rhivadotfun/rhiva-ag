import { eq } from "drizzle-orm";
import { poolFilterInsertSchema, poolFilters } from "@rhiva-ag/datasource";

import { privateProcedure, router } from "../../trpc";

export const poolFilterRoute = router({
  create: privateProcedure
    .input(poolFilterInsertSchema.omit({ user: true }))
    .mutation(async ({ ctx, input }) => {
      const [poolFilter] = await ctx.drizzle
        .insert(poolFilters)
        .values({ ...input, user: ctx.user.id })
        .returning();
      return poolFilter;
    }),
  list: privateProcedure.query(async ({ ctx }) =>
    ctx.drizzle.query.poolFilters.findMany({
      where: eq(poolFilters.user, ctx.user.id),
    }),
  ),
});
