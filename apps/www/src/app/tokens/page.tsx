import { dexApi } from "@/instances";
import TokensClientPage from "./page.client";
import type { AppProps } from "next/app";

export default async function TokensPage(props: PageProps<"/tokens">) {
  const searchParams = await props.searchParams;

  const tokens = await dexApi.jup.token.list({
    limit: 50,
    timestamp: "24h",
    category: "toptraded",
    ...searchParams,
  });

  return (
    <TokensClientPage
      initialData={tokens}
      searchParams={searchParams}
    />
  );
}
