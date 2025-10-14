import Dex from "@rhiva-ag/dex";

import { loadWallet } from "../../../utils/wallet";
import { privateProcedure, router } from "../../../trpc";
import { closePosition, createPosition } from "./orca.controller";
import {
  orcaCreatePositionSchema,
  orcaClosePositionSchema,
} from "./orca.schema";

export const orcaRoute = router({
  create: privateProcedure
    .input(orcaCreatePositionSchema)
    .mutation(async ({ ctx, input }) => {
      const dex = new Dex(ctx.connection);
      const owner = loadWallet(ctx.user.wallet, ctx.secret);

      return createPosition(dex, ctx.sendTransaction, owner, input);
    }),
  close: privateProcedure
    .input(orcaClosePositionSchema)
    .mutation(async ({ ctx, input }) => {
      const dex = new Dex(ctx.connection);
      const owner = loadWallet(ctx.user.wallet, ctx.secret);

      return closePosition(dex, ctx.sendTransaction, owner, input);
    }),
});
