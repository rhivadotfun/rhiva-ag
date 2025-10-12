import type Coingecko from "@coingecko/coingecko-typescript";

export async function calculateFearGreed(coingecko: Coingecko) {
  const pools = coingecko.onchain.pools.trendingSearch.get();
}
