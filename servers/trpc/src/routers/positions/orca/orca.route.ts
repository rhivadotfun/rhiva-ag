import Dex from "@rhiva-ag/dex";
import { Work } from "@rhiva-ag/cron";

import { createQueue } from "../shared";
import { privateProcedure, router } from "../../../trpc";
import { claimReward, closePosition, createPosition } from "./orca.controller";
import {
  orcaClaimRewardSchema,
  orcaCreatePositionSchema,
  orcaClosePositionSchema,
} from "./orca.schema";
import { loadWallet } from "@rhiva-ag/shared";

const queue = createQueue();

export const orcaRoute = router({
  create: privateProcedure
    .input(orcaCreatePositionSchema)
    .mutation(async ({ ctx, input }) => {
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
          dex: "orca",
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
    .input(orcaClaimRewardSchema)
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
    .input(orcaClosePositionSchema)
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
          dex: "orca",
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
