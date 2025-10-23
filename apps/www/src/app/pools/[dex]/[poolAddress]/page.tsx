import { dexApi } from "@/instances";
import PoolClientPage from "./page.client";

export default async function PoolPage(
  props: PageProps<"/pools/[dex]/[poolAddress]">,
) {
  const params = await props.params;
  const pool = await dexApi.getPair(params.dex, params.poolAddress);

  return (
    <PoolClientPage
      initialData={pool}
      params={params}
    />
  );
}
