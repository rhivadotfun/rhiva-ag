import { format } from "util";
import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import TokensClientPage from "./page.client";
import type { TimeFrame } from "./page.client";
import { getQueryClient } from "@/trpc.server";
import {
  compactCurrencyIntlArgs,
  percentageIntlArgs,
} from "@/constants/format";

export async function generateMetadata(
  props: PageProps<"/tokens/[tokenAddress]">,
): Promise<Metadata> {
  const params = await props.params;
  const queryClient = getQueryClient();
  const currencyIntl = new Intl.NumberFormat("en-US", compactCurrencyIntlArgs);
  const percentageIntl = new Intl.NumberFormat("en-US", percentageIntlArgs);

  const [token] = await queryClient.fetchQuery({
    queryKey: ["tokens", params.tokenAddress],
    queryFn: () =>
      dexApi.jup.token.list({
        category: "search",
        query: params.tokenAddress,
      }),
  });

  return {
    title: format("%s | Rhiva", token.name),
    description: format(
      "The live market cap of %s today is %s with a 24-hour change of %s.",
      token.name,
      currencyIntl.format(token.mcap),
      percentageIntl.format(token.stats24h.priceChange),
    ),
    openGraph: {
      images: [
        format(
          "%s/api/media/token-card?data=%s",
          process.env.NEXT_PUBLIC_MEDIA_URL,
          encodeURIComponent(JSON.stringify(token)),
        ),
      ],
    },
  };
}

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
