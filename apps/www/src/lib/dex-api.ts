import type { DexApi } from "@rhiva-ag/dex-api";
import { collectionToMap } from "@rhiva-ag/shared";

export async function getPair(
  dexApi: DexApi,
  dex: "orca" | "saros" | "raydium" | "meteora",
  pairAddress: string,
) {
  switch (dex) {
    case "orca": {
      const {
        data: [pair],
      } = await dexApi.orca.pool.list({ addresses: [pairAddress] });
      const tokens = await dexApi.jup.token.list({
        category: "search",
        query: [pair.tokenA.address, pair.tokenB.address].join(","),
      });

      const mapTokens = collectionToMap(tokens, (token) => token.id);

      return {
        ...dexApi.orca.pool.normalize(pair),
        extra: pair,
        baseToken: mapTokens.get(pair.tokenA.address)!,
        quoteToken: mapTokens.get(pair.tokenB.address)!,
      };
    }
    case "meteora": {
      const pair = await dexApi.meteora.pair.getPair(pairAddress);
      const tokens = await dexApi.jup.token.list({
        category: "search",
        query: [pair.mint_x, pair.mint_y].join(","),
      });

      const mapTokens = collectionToMap(tokens, (token) => token.id);
      const baseToken = mapTokens.get(pair.mint_x)!;
      const quoteToken = mapTokens.get(pair.mint_y)!;

      return {
        ...dexApi.meteora.pair.normalize(
          pair,
          baseToken.decimals,
          quoteToken.decimals,
        ),
        extra: pair,
        baseToken: mapTokens.get(pair.mint_x)!,
        quoteToken: mapTokens.get(pair.mint_y)!,
      };
    }
    case "raydium": {
      const {
        data: [pair],
      } = await dexApi.raydium.pool.ids(pairAddress);
      const tokens = await dexApi.jup.token.list({
        category: "search",
        query: [pair.mintA.address, pair.mintB.address].join(","),
      });

      const mapTokens = collectionToMap(tokens, (token) => token.id);
      const baseToken = mapTokens.get(pair.mintA.address)!;
      const quoteToken = mapTokens.get(pair.mintB.address)!;
      return {
        ...dexApi.raydium.pool.normalize(
          pair,
          baseToken.usdPrice,
          quoteToken.usdPrice,
        ),
        extra: pair,
        baseToken,
        quoteToken,
      };
    }
    case "saros": {
      const { data: pair } = await dexApi.saros.pool.retrieve(pairAddress);
      const tokens = await dexApi.jup.token.list({
        category: "search",
        query: [pair.tokenX.address, pair.tokenY.address].join(","),
      });

      const mapTokens = collectionToMap(tokens, (token) => token.id);
      const baseToken = mapTokens.get(pair.tokenX.address)!;
      const quoteToken = mapTokens.get(pair.tokenY.address)!;
      return {
        ...dexApi.saros.pool.normalize(pair),
        extra: pair,
        baseToken,
        quoteToken,
      };
    }
  }
}
