import PoolClientPage from "./page.client";
import { getTRPCClient } from "@/trpc.server";

export default async function PoolPage() {
  const trpcClient = getTRPCClient();
  const pools = await trpcClient.pool.list.query({
    sort: "h6_trending",
    include: "base_token,quote_token",
  });

  return <PoolClientPage initialData={pools} />;
}
