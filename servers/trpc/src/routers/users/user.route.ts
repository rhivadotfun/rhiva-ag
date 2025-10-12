import { count, eq, getTableColumns, sum } from "drizzle-orm";
import {
  coalesce,
  referrers,
  rewards,
  rewardTypes,
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
        xp: sum(rewardTypes.xp).as("xp"),
      })
      .from(rewards)
      .innerJoin(rewardTypes, eq(rewardTypes.id, rewards.rewardType))
      .groupBy(rewards.user)
      .as("qRewards");

    const qReferrers = ctx.drizzle
      .select({
        referer: referrers.referer,
        referXp: sum(qRewards.xp).as("referXp"), // todo: calculate 10% of this
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
        xp: coalesce(qRewards.xp, 0).mapWith(Number),
      })
      .from(users)
      .leftJoin(qReferrers, eq(qReferrers.referer, users.id))
      .leftJoin(qRewards, eq(qRewards.user, users.id))
      .innerJoin(settings, eq(settings.user, users.id))
      .innerJoin(wallets, eq(wallets.user, users.id));

    return user;
  }),
});
