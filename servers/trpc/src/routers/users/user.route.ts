import { TRPCError } from "@trpc/server";
import { count, eq, getTableColumns, isNull, not, sum } from "drizzle-orm";
import {
  caseWhen,
  coalesce,
  mul,
  referrers,
  rewards,
  settings,
  users,
  userSelectSchema,
  wallets,
} from "@rhiva-ag/datasource";

import { privateProcedure, router } from "../../trpc";

export const userRoute = router({
  me: privateProcedure.output(userSelectSchema).query(async ({ ctx }) => {
    const qRewards = ctx.drizzle
      .select({
        user: rewards.user,
        xp: sum(rewards.xp).as("xp"),
      })
      .from(rewards)
      .groupBy(rewards.user)
      .as("qRewards");

    const qReferrers = ctx.drizzle
      .select({
        referer: referrers.referer,
        referXp: mul(sum(qRewards.xp), 0.1).as("referXp"),
        totalRefer: count(referrers.referer).as("totalRefer"),
      })
      .from(referrers)
      .where(eq(referrers.referer, ctx.user.id))
      .leftJoin(qRewards, eq(qRewards.user, referrers.user))
      .groupBy(referrers.referer)
      .as("qReferrers");

    const [user] = await ctx.drizzle
      .select({
        ...getTableColumns(users),
        wallet: getTableColumns(wallets),
        settings: getTableColumns(settings),
        referXp: coalesce(qReferrers.referXp, 0).mapWith(Number),
        totalRefer: coalesce(qReferrers.totalRefer, 0).mapWith(Number),
        xp: coalesce(
          caseWhen(not(isNull(referrers.user)), qRewards.xp),
          0,
        ).mapWith(Number),
      })
      .from(users)
      .leftJoin(referrers, eq(referrers.user, users.id))
      .leftJoin(qReferrers, eq(qReferrers.referer, users.id))
      .leftJoin(qRewards, eq(qRewards.user, users.id))
      .innerJoin(settings, eq(settings.user, users.id))
      .innerJoin(wallets, eq(wallets.user, users.id));

    if (user) return user;

    throw new TRPCError({ code: "NOT_FOUND", message: "user not found" });
  }),
});
