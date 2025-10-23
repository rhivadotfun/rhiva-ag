import z from "zod";
import { eq } from "drizzle-orm";
import { refererInsertSchema, referrers, users } from "@rhiva-ag/datasource";

import { getEnv } from "../../env";
import { privateProcedure, publicProcedure, router } from "../../trpc";

export const referRoute = router({
  verify: publicProcedure
    .input(
      z.object({
        code: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const staticReferralCode = getEnv("STATIC_REFERRAL_CODE");
      if (input.code === staticReferralCode)
        return { exists: true, referer: null };

      const cache = await ctx.redis.hget("accessCode", input.code);
      if (cache) return { isExist: true };
      const referer = await ctx.drizzle.query.users.findFirst({
        where: eq(users.referralCode, input.code),
      });

      if (referer) {
        await ctx.redis.hset("accessCode", input.code);
        return { referer, exists: true };
      }

      return { exists: false };
    }),
  create: privateProcedure
    .input(refererInsertSchema.pick({ referer: true }))
    .mutation(async ({ ctx, input }) => {
      const [referral] = await ctx.drizzle
        .insert(referrers)
        .values({
          ...input,
          user: ctx.user.id,
        })
        .onConflictDoNothing({ target: [referers.user, referrers.referer] })
        .returning();

      if (referral) return referral;
      return null;
    }),
});
