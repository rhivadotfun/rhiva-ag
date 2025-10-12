"use client";
import { useQuery } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import Header from "@/components/layout/Header";
import SearchInput from "@/components/SearchInput";
import TokenList from "@/components/token/TokenList";
import TokenTimeSort from "@/components/token/TokenTimeSort";

export default function TokensPage() {
  const { data } = useQuery({
    queryKey: ["tokens"],
    queryFn: () =>
      dexApi.jup.token.list({
        category: "toptraded",
        timestamp: "5m",
        limit: 50,
      }),
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-scroll lt-sm:fixed lt-sm:inset-0 lt-md:z-50 lt-sm:bg-dark">
      <Header
        canBack
        className="sticky top-0 z-10"
      />
      <div className="flex-1 flex flex-col space-y-4 overflow-y-scroll p-4">
        <div className="flex items-center space-x-4 justify-between">
          <SearchInput
            placeholder="Search"
            className="lt-sm:flex-1 sm:min-w-md"
          />
          <TokenTimeSort />
        </div>
        {data && <TokenList tokens={data} />}
      </div>
    </div>
  );
}
