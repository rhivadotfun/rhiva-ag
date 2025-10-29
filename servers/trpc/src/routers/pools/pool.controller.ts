import type z from "zod";
import type Coingecko from "@coingecko/coingecko-typescript";
import { mapFilter, type NonNullable } from "@rhiva-ag/shared";
import type { PoolGetResponse } from "@coingecko/coingecko-typescript/resources/onchain/networks.js";
import type { MegafilterGetResponse } from "@coingecko/coingecko-typescript/resources/onchain/pools.js";

import type { poolFilterSchema, poolSearchSchema } from "./pool.schema";

const supportedDex = ["orca", "meteora", "saros-dlmm", "raydium-clmm"];
export const getPools = async (
  coingecko: Coingecko,
  input:
    | z.infer<typeof poolFilterSchema>
    | z.infer<typeof poolSearchSchema>
    | undefined,
) => {
  let response: MegafilterGetResponse | PoolGetResponse;
  if (input && "query" in input)
    response = await coingecko.onchain.search.pools.get(input);
  else response = await coingecko.onchain.pools.megafilter.get(input);

  if (response.data && response.included) {
    const { data, included } = response;
    const mapIncludes = new Map(
      included.map((include) => [include.id, include.attributes]),
    );

    return mapFilter(data, (data) => {
      const { relationships, attributes } = data;
      if (relationships && attributes) {
        const dex = relationships.dex?.data;
        const base_token = mapIncludes.get(relationships.base_token?.data?.id);
        const quote_token = mapIncludes.get(
          relationships.quote_token?.data?.id,
        );
        if (
          base_token &&
          quote_token &&
          dex?.id &&
          supportedDex.includes(dex.id)
        )
          return {
            ...attributes,
            dex: relationships.dex?.data,
            base_token,
            quote_token,
          } as NonNullable<MegafilterGetResponse.Data.Attributes> & {
            dex: NonNullable<MegafilterGetResponse.Data.Relationships.Dex.Data>;
            base_token: NonNullable<MegafilterGetResponse.Included.Attributes>;
            quote_token: NonNullable<MegafilterGetResponse.Included.Attributes>;
          };
      }

      return null;
    });
  }
};
