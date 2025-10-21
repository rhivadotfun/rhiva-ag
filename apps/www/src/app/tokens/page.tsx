import { dexApi } from "@/instances";
import TokensClientPage from "./page.client";

export default async function TokensPage() {
  const tokens = await dexApi.jup.token.list({
    limit: 50,
    timestamp: "1h",
    category: "toptraded",
  });

  return <TokensClientPage initialData={tokens} />;
}
