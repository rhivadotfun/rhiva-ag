"use client";
import { useState } from "react";
import type { AppRouter } from "@rhiva-ag/trpc";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import Header from "@/components/layout/Header";
import PoolTab from "@/components/pools/PoolTab";
import PoolList from "@/components/pools/PoolList";
import SearchInput from "@/components/SearchInput";
import PoolSort from "@/components/pools/PoolSort";
import { useTRPC, useTRPCClient } from "@/trpc.client";
import PoolFilter from "@/components/pools/PoolFilter";
import PoolInfoList from "@/components/pools/PoolInfoList";

type PoolClientPageProps = {
  initialData?: Awaited<ReturnType<AppRouter["pool"]["list"]>>;
};

export default function PoolClientPage({ initialData }: PoolClientPageProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState<string | undefined>();

  const { data } = useQuery({
    initialData,
    queryKey: trpc.pool.list.queryKey({ query }),
    queryFn: () =>
      trpcClient.pool.list.query({
        query,
        sort: "h6_trending",
        include: "base_token,quote_token",
        ...Object.fromEntries(searchParams.entries()),
      }),
  });

  return (
    <div className="flex-1 flex flex-col lg:p-4 overflow-y-scroll">
      <Header
        title="Pools"
        className="sticky top-0 z-10"
      />
      <div className="flex-1 flex flex-col overflow-y-scroll py-4">
        <div className="flex flex-col space-y-4 px-4">
          <div className="flex flex-col space-y-2">
            <div className="flex lt-lg:flex-col lt-lg:space-y-2 lg:items-center lg:justify-between lg:space-x-4">
              <div className="lt-lg:flex lt-lg:space-x-4">
                <SearchInput
                  placeholder="Search"
                  className="lt-lg:flex-1 lg:self-start backdrop-blur-2xl p-2"
                  onChange={(value) => {
                    if (value) setQuery(value);
                    else setQuery(undefined);
                  }}
                />
                <PoolFilter className="lg:hidden" />
              </div>
              <PoolInfoList className="lg:self-end backdrop-blur-2xl" />
            </div>
            <div className="flex lt-lg:flex-col lg:items-center lg:justify-between lg:space-x-4">
              <PoolTab className="lt-lg:hidden" />

              <div className="lg:flex lg:items-center lg:space-x-2 lt-lg:flex-1 ">
                <PoolSort />
                <PoolFilter className="lt-lg:hidden backdrop-blur-2xl" />
              </div>
            </div>
          </div>
          {data && <PoolList pools={data} />}
        </div>
      </div>
    </div>
  );
}
