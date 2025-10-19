import moment from "moment";
import { TRPCError } from "@trpc/server";
import { count, eq, getTableColumns, sum } from "drizzle-orm";
import {
  add,
  date,
  caseWhen,
  coalesce,
  mul,
  referrers,
  rewards,
  settings,
  users,
  userSelectSchema,
  wallets,
  rank,
  count as countAll,
} from "@rhiva-ag/datasource";

import { privateProcedure, router } from "../../trpc";

export const userRoute = router({
  me: privateProcedure.output(userSelectSchema).query(async ({ ctx }) => {
    const today = moment().startOf("day").toDate();
    const qRewards = ctx.drizzle
      .select({
        user: rewards.user,
        xp: sum(rewards.xp).as("xp"),
        todayXp: sum(caseWhen(eq(date(rewards.createdAt), today), rewards.xp))
          .mapWith(Number)
          .as("todayXp"),
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

    const qRanks = ctx.drizzle
      .select({
        id: users.id,
        totalUsers: countAll().mapWith(Number).as("totalUsers"),
        rank: rank(qRewards.xp).mapWith(Number).as("rank"),
        todayXp: coalesce(qRewards.todayXp, 0).mapWith(Number).as("todayXp"),
        referXp: coalesce(qReferrers.referXp, 0).mapWith(Number).as("referXp"),
        totalRefer: coalesce(qReferrers.totalRefer, 0)
          .mapWith(Number)
          .as("totalRefer"),
        xp: coalesce(add(qRewards.xp, qReferrers.referXp), 0)
          .mapWith(Number)
          .as("xp"),
      })
      .from(users)
      .leftJoin(referrers, eq(referrers.user, users.id))
      .leftJoin(qReferrers, eq(qReferrers.referer, users.id))
      .leftJoin(qRewards, eq(qRewards.user, users.id))
      .as("qRanks");

    const [user] = await ctx.drizzle
      .select({
        ...qRanks._.selectedFields,
        ...getTableColumns(users),
        wallet: getTableColumns(wallets),
        settings: getTableColumns(settings),
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .leftJoin(qRanks, eq(qRanks.id, users.id))
      .innerJoin(settings, eq(settings.user, users.id))
      .innerJoin(wallets, eq(wallets.user, users.id));

    if (user) return user;

    throw new TRPCError({ code: "NOT_FOUND", message: "user not found" });
  }),
});
