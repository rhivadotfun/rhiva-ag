import type Coingecko from "@coingecko/coingecko-typescript";

export async function calculateFearGreed(coingecko: Coingecko) {
  const _pools = coingecko.onchain.pools.trendingSearch.get();
}
