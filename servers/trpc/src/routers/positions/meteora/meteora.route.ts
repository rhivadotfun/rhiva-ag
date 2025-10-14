import Dex from "@rhiva-ag/dex";

import { loadWallet } from "../../../utils/wallet";
import { privateProcedure, router } from "../../../trpc";
import { closePosition, createPosition } from "./meteora.controller";
import {
  meteoraCreatePositionSchema,
  meteoraClosePositionSchema,
} from "./meteora.schema";

export const meteoraRoute = router({
  create: privateProcedure
    .input(meteoraCreatePositionSchema)
    .mutation(async ({ ctx, input }) => {
      const owner = loadWallet(ctx.user.wallet, ctx.secret);
      const dex = new Dex(ctx.connection);
      return createPosition(dex, ctx.sendTransaction, owner, input);
    }),
  close: privateProcedure
    .input(meteoraClosePositionSchema)
    .mutation(async ({ ctx, input }) => {
      const owner = loadWallet(ctx.user.wallet, ctx.secret);
      const dex = new Dex(ctx.connection);
      return closePosition(dex, ctx.sendTransaction, owner, input);
    }),
});
