import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import TokensClientPage from "./page.client";
import { getQueryClient } from "@/trpc.server";

export default async function TokensPage(props: PageProps<"/tokens">) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;

  await queryClient.prefetchQuery({
    queryKey: ["tokens", searchParams.timestamp],
    queryFn: async () =>
      dexApi.jup.token.list({
        limit: 50,
        timestamp: "24h",
        category: "toptraded",
        ...searchParams,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TokensClientPage searchParams={searchParams} />
    </HydrationBoundary>
  );
}
