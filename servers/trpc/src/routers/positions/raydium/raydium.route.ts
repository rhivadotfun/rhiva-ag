import Dex from "@rhiva-ag/dex";

import { loadWallet } from "../../../utils/wallet";
import { privateProcedure, router } from "../../../trpc";
import { closePosition, createPosition } from "./raydium.controller";
import {
  raydiumCreatePositionSchema,
  raydiumClosePositionSchema,
} from "./raydium.schema";

export const raydiumRoute = router({
  create: privateProcedure
    .input(raydiumCreatePositionSchema)
    .mutation(async ({ ctx, input }) => {
      const dex = new Dex(ctx.connection);
      const owner = loadWallet(ctx.user.wallet, ctx.secret);

      return createPosition(dex, ctx.sendTransaction, owner, input);
    }),
  close: privateProcedure
    .input(raydiumClosePositionSchema)
    .mutation(async ({ ctx, input }) => {
      const dex = new Dex(ctx.connection);
      const owner = loadWallet(ctx.user.wallet, ctx.secret);

      return closePosition(dex, ctx.sendTransaction, owner, input);
    }),
});
