import { Work } from "@rhiva-ag/cron";
import { createQueue } from "../src/routers/positions/shared";

const queue = createQueue();

(async () => {
  const response = await queue.add(
    Work.syncTransaction,
    {
      bundleId:
        "b91f3eee2422753dd6b9a746e5b5efcd58d1d783056fc5024321afa9cc07ba2a",
      dex: "meteora",
      type: "create-position",
      wallet: {
        user: "1c3f406b-7559-4114-b9a9-56730cb7a81a",
        id: "B9smu3m37Zh3rhLbaAovXVBUyQxK5SBte5i1NBxjDnm2",
      },
    },
    {
      jobId: "b91f3eee2422753dd6b9a746e5b5efcd58d1d783056fc5024321afa9cc07ba2a",
      removeOnComplete: true,
    },
  );
  console.log(await response.getState(), { depth: null });
})();
