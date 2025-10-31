import { format } from "util";
import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import PoolClientPage from "./page.client";
import { getQueryClient } from "@/trpc.server";
import { compactCurrencyIntlArgs } from "@/constants/format";

export async function generateMetadata(
  props: PageProps<"/pools/[dex]/[poolAddress]">,
): Promise<Metadata> {
  const params = await props.params;
  const queryClient = getQueryClient();
  const currencyIntl = new Intl.NumberFormat("en-US", compactCurrencyIntlArgs);

  const pool = await queryClient.fetchQuery({
    queryKey: ["pools", params.dex, params.poolAddress],
    queryFn: async () => {
      const response = await dexApi.getPair(params.dex, params.poolAddress);
      return response!;
    },
  });

  return {
    title: format("%s on %s | Rhiva", pool.name, params.dex),
    description: format(
      "The current TVL of %s today is %s with a 24-hour fees of %s.",
      pool.name,
      currencyIntl.format(pool.tvl ?? 0),
      currencyIntl.format(pool.fees24H ?? 0),
    ),
    openGraph: {
      images: [
        format(
          "%s/api/media/pool-card?data=%s",
          process.env.NEXT_PUBLIC_MEDIA_URL,
          encodeURIComponent(JSON.stringify(pool)),
        ),
      ],
    },
  };
}

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
