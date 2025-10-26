import Dex from "@rhiva-ag/dex";
import { Work } from "@rhiva-ag/cron";
import { mints } from "@rhiva-ag/datasource";
import { loadWallet } from "@rhiva-ag/shared";

import { createQueue } from "../shared";
import { privateProcedure, router } from "../../../trpc";
import {
  claimReward,
  closePosition,
  createPosition,
} from "./raydium.controller";
import {
  raydiumClaimRewardSchema,
  raydiumCreatePositionSchema,
  raydiumClosePositionSchema,
} from "./raydium.schema";

const queue = createQueue();

export const raydiumRoute = router({
  create: privateProcedure
    .input(raydiumCreatePositionSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.tokens)
        await ctx.drizzle
          .insert(mints)
          .values(input.tokens)
          .onConflictDoUpdate({
            target: [mints.id],
            set: {
              name: mints.name,
              symbol: mints.symbol,
              image: mints.image,
            },
          });
      const dex = new Dex(ctx.connection);
      const owner = await loadWallet(ctx.user.wallet, ctx.secret);

      const { execute } = await createPosition(
        dex,
        ctx.sendTransaction,
        owner,
        input,
      );

      const bundleId = await execute();
      const response = await queue.add(
        Work.syncTransaction,
        {
          bundleId,
          dex: "raydium-clmm",
          type: "create-position",
          wallet: ctx.user.wallet,
        },
        { jobId: bundleId },
      );

      return {
        jobId: response.id,
        ...response.data,
      };
    }),
  claim: privateProcedure
    .input(raydiumClaimRewardSchema)
    .mutation(async ({ ctx, input }) => {
      const dex = new Dex(ctx.connection);
      const owner = await loadWallet(ctx.user.wallet, ctx.secret);
      const { execute } = await claimReward(
        dex,
        ctx.sendTransaction,
        owner,
        input,
      );

      const bundleId = await execute();

      return {
        bundleId,
      };
    }),

  close: privateProcedure
    .input(raydiumClosePositionSchema)
    .mutation(async ({ ctx, input }) => {
      const dex = new Dex(ctx.connection);
      const owner = await loadWallet(ctx.user.wallet, ctx.secret);
      const { execute } = await closePosition(
        dex,
        ctx.sendTransaction,
        owner,
        input,
      );

      const bundleId = await execute();
      const response = await queue.add(
        Work.syncTransaction,
        {
          bundleId,
          dex: "raydium-clmm",
          type: "close-position",
          wallet: ctx.user.wallet,
        },
        { jobId: bundleId },
      );

      return {
        jobId: response.id,
        ...response.data,
      };
    }),
});
