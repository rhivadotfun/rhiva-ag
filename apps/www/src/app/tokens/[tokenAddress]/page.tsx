import { dexApi } from "@/instances";
import TokensClientPage from "./page.client";
import type { TimeFrame } from "./page.client";

export default async function TokenPage(
  props: PageProps<"/tokens/[tokenAddress]">,
) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const tokens = await dexApi.jup.token.list({
    category: "search",
    query: params.tokenAddress,
  });

  return (
    <TokensClientPage
      params={params}
      initialData={tokens}
      searchParams={
        searchParams as unknown as { timeframe: keyof typeof TimeFrame }
      }
    />
  );
}
