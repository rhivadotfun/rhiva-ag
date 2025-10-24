import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import TokensClientPage from "./page.client";
import type { TimeFrame } from "./page.client";
import { getQueryClient } from "@/trpc.server";

export default async function TokenPage(
  props: PageProps<"/tokens/[tokenAddress]">,
) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["tokens", params.tokenAddress],
    queryFn: () =>
      dexApi.jup.token.list({
        category: "search",
        query: params.tokenAddress,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TokensClientPage
        params={params}
        searchParams={
          searchParams as unknown as { timeframe: keyof typeof TimeFrame }
        }
      />
    </HydrationBoundary>
  );
}
