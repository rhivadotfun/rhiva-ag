import { privateProcedure, router } from "../../trpc";

export const rewardRoute = router({
  list: privateProcedure.query(async () => {}),
});
