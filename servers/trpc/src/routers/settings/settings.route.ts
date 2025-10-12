import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { settings, settingsUpdateSchema } from "@rhiva-ag/datasource";

import { privateProcedure, router } from "../../trpc";

export const settingsRoute = router({
  update: privateProcedure
    .input(settingsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedSettings] = await ctx.drizzle
        .update(settings)
        .set(input)
        .where(eq(settings.user, ctx.user.id))
        .returning();

      if (updatedSettings) return updatedSettings;

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "settings not found.",
      });
    }),
});
