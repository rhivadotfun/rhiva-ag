import { getTokens } from "@civic/auth/nextjs";

import { getTRPCClient } from "@/trpc.server";
import { getWalletTokens } from "@/lib/get-tokens";
import { dexApi, solanaConnection } from "@/instances";
import PortfolioClientPage from "./page.client";

export default async function PortfolioPage() {
  const token = await getTokens();
  const trpcClient = getTRPCClient(token?.accessToken);
  const user = await trpcClient.user.me.query();
  const tokenOverview = await getWalletTokens(
    solanaConnection,
    dexApi,
    user.wallet.id,
  );

  return <PortfolioClientPage initialData={{ tokenOverview }} />;
}
