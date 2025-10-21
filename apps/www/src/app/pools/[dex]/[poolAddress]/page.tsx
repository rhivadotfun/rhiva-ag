import PoolClientPage from "./page.client";

export default async function PoolPage(
  props: PageProps<"/pools/[dex]/[poolAddress]">,
) {
  const params = await props.params;

  return <PoolClientPage params={params} />;
}
