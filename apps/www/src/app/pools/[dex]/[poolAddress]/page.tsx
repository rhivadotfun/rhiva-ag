"use client";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import { getPair } from "@/lib/dex-api";
import type { AppProps } from "@/types/props";
import Header from "@/components/layout/Header";
import PoolInfo from "@/components/pools/PoolInfo";
import PoolAnalytic from "@/components/pools/PoolAnalytic";
import PoolTokenMetadata from "@/components/pools/PoolTokenMetadata";
import MeteoraOpenPosition from "@/components/positions/meteora/OpenPositionModal";

export default function PoolPage({
  params,
}: AppProps<
  { dex: "orca" | "raydium" | "meteora"; poolAddress: string },
  null
>) {
  const { dex, poolAddress } = use(params);
  const [showCreatePositionModal, setShowCreatePositionModal] = useState(false);

  const { data } = useQuery({
    queryKey: ["pools", dex, poolAddress],
    queryFn: async () => {
      const response = await getPair(dexApi, dex, poolAddress);
      return response;
    },
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-scroll">
      <Header
        canBack
        className="sticky top-0 z-10"
      />
      {data && (
        <div className="flex-1 flex flex-col overflow-y-scroll p-4 xl:grid xl:grid-cols-2">
          <div className="flex  lt-sm:flex-col lt-sm:space-y-4 sm:space-x-8">
            <div className="flex-1 flex flex-col space-y-4 sm:space-y-8">
              <PoolTokenMetadata
                id={data.address}
                dex={dex}
                name={data.name}
                image={{
                  base: {
                    src: data.baseToken.icon,
                    alt: data.baseToken.symbol,
                  },
                  quote: {
                    src: data.quoteToken.icon,
                    alt: data.quoteToken.symbol,
                  },
                }}
              />

              <PoolInfo
                tvl={data.tvl}
                apr={data.apr}
                tokens={[
                  {
                    id: data.baseToken.id,
                    image: data.baseToken.icon,
                    name: data.baseToken.symbol,
                    amount: data.baseReserveAmount,
                    score: data.baseToken.organicScore,
                  },
                  {
                    id: data.quoteToken.id,
                    image: data.quoteToken.icon,
                    name: data.quoteToken.symbol,
                    amount: data.quoteReserveAmount,
                    score: data.baseToken.organicScore,
                  },
                ]}
              />
            </div>
            <PoolAnalytic
              className="flex-1"
              binStep={data.binStep}
              baseFee={data.baseFee}
              maxFee={data.maxFee}
              liquidity={data.liquidity}
              fees24h={data.fees24H}
              fees7d={data.fees7d}
              volume={data.volume24h}
              price={data.price}
            />
          </div>
          <div className="flex-1 flex flex flex-col">
            <MeteoraOpenPosition
              open={showCreatePositionModal}
              onClose={setShowCreatePositionModal}
            />
            <button
              type="button"
              className="bg-primary text-black p-2 rounded-md"
              onClick={() => setShowCreatePositionModal(true)}
            >
              Open Position
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
