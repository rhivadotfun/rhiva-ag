import { format } from "util";
import type { Metadata, ResolvingMetadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import PoolClientPage from "./page.client";
import { getQueryClient } from "@/trpc.server";
import { compactCurrencyIntlArgs } from "@/constants/format";

type PoolData = {
  name: string;
  price?: number;
  apr?: number;
  tvl?: number;
  volume24h: number;
  baseFee: number;
  maxFee: number;
  dex: string;
  baseToken: {
    name: string;
    symbol: string;
    icon: string;
  };
  quoteToken: {
    name: string;
    symbol: string;
    icon: string;
  };
};

export async function generateMetadata(
  props: PageProps<"/pools/[dex]/[poolAddress]">,
  parent: ResolvingMetadata,
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

  const data: PoolData = {
    name: pool.name,
    price: pool.price,
    apr: pool.apr,
    tvl: pool.tvl,
    maxFee: pool.maxFee,
    baseFee: pool.baseFee,
    volume24h: pool.volume24h,
    dex: params.dex,
    baseToken: {
      name: pool.baseToken.name,
      symbol: pool.baseToken.symbol,
      icon: pool.baseToken.icon,
    },
    quoteToken: {
      name: pool.quoteToken.name,
      symbol: pool.quoteToken.symbol,
      icon: pool.quoteToken.icon,
    },
  };

  return {
    title: format("%s on %s | Rhiva", pool.name, params.dex),
    description: format(
      "The current TVL of %s today is %s with a 24-hour fees of %s.",
      pool.name,
      currencyIntl.format(pool.tvl ?? 0),
      currencyIntl.format(pool.fees24H ?? 0),
    ),
    openGraph: {
      type: "website",
      url: "https://beta.rhiva.fun",
      images: [
        format(
          "%s/api/media/pool-card?data=%s",
          process.env.NEXT_PUBLIC_MEDIA_URL,
          JSON.stringify(data),
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
