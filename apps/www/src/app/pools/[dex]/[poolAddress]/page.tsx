"use client";
import { AuthStatus } from "@civic/auth";
import { useUser } from "@civic/auth/react";
import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import { getPair } from "@/lib/dex-api";
import type { AppProps } from "@/types/props";
import Header from "@/components/layout/Header";
import PoolInfo from "@/components/pools/PoolInfo";
import PoolAnalytic from "@/components/pools/PoolAnalytic";
import OpenPosition from "@/components/positions/OpenPosition";
import PoolTokenMetadata from "@/components/pools/PoolTokenMetadata";

import { useAuth } from "@/hooks/useAuth";

export default function PoolPage({
  params,
}: AppProps<
  { dex: "orca" | "raydium" | "meteora"; poolAddress: string },
  null
>) {
  const { user } = useAuth();
  const { authStatus, signIn } = useUser();
  const { dex, poolAddress } = use(params);
  const [showCreatePositionModal, setShowCreatePositionModal] = useState(false);

  const isAuthenticated = useMemo(
    () => user && authStatus === AuthStatus.AUTHENTICATED,
    [authStatus, user],
  );

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
          <div className="flex-1 flex flex-col lt-sm:gap-y-4 sm:grid sm:grid-cols-2 sm:gap-x-8">
            <div className="flex flex-col space-y-4 sm:space-y-8">
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
              binStep={data.binStep}
              baseFee={data.baseFee}
              maxFee={data.maxFee}
              liquidity={data.liquidity}
              fees24h={data.fees24H}
              fees7d={data.fees7d}
              volume={data.volume24h}
              price={data.price}
            />
            <div className="sm:col-span-2" />
          </div>

          <div className="flex flex flex-col sm:flex sm:items-center">
            {isAuthenticated && (
              <OpenPosition
                dex={dex}
                pool={data}
                open={showCreatePositionModal}
                onClose={setShowCreatePositionModal}
              />
            )}
            <button
              type="button"
              className="bg-primary text-black p-2 rounded-md sm:hidden"
              onClick={() => {
                if (isAuthenticated) setShowCreatePositionModal(true);
                else signIn();
              }}
            >
              Open Position
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
