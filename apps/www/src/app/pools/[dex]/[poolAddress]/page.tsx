import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import PoolClientPage from "./page.client";
import { getQueryClient } from "@/trpc.server";

export default async function PoolPage(
  props: PageProps<"/pools/[dex]/[poolAddress]">,
) {
  const params = await props.params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["pools", params.dex, params.poolAddress],
    queryFn: async () => dexApi.getPair(params.dex, params.poolAddress),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PoolClientPage params={params} />
    </HydrationBoundary>
  );
}
