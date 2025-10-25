import Dex from "@rhiva-ag/dex";
import { Work } from "@rhiva-ag/cron";

import { createQueue } from "../shared";
import { privateProcedure, router } from "../../../trpc";
import { closePosition, createPosition } from "./meteora.controller";
import {
  meteoraCreatePositionSchema,
  meteoraClosePositionSchema,
  meteoraClaimRewardSchema,
} from "./meteora.schema";
import { loadWallet } from "@rhiva-ag/shared";

const queue = createQueue();

export const meteoraRoute = router({
  create: privateProcedure
    .input(meteoraCreatePositionSchema)
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
          dex: "meteora",
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
    .input(meteoraClaimRewardSchema)
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

      return {
        bundleId,
      };
    }),
  close: privateProcedure
    .input(meteoraClosePositionSchema)
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
          dex: "meteora",
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
