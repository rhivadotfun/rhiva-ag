"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Token } from "@rhiva-ag/dex-api/jup/types";

import { dexApi } from "@/instances";
import Header from "@/components/layout/Header";
import SearchInput from "@/components/SearchInput";
import TokenList from "@/components/token/TokenList";
import TokenTimeSort from "@/components/token/TokenTimeSort";

type TokensClientPageProps = {
  initialData?: Token[];
};

export default function TokensClientPage({
  initialData,
}: TokensClientPageProps) {
  const [search, setSearch] = useState<string | null | undefined>();
  const { data } = useQuery({
    initialData,
    queryKey: ["tokens", search],
    queryFn: () =>
      dexApi.jup.token.list({
        limit: 50,
        timestamp: "1h",
        query: search ? search : undefined,
        category: search ? "toptraded" : "search",
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
            onChange={setSearch}
          />
          <TokenTimeSort />
        </div>
        {data && <TokenList tokens={data} />}
      </div>
    </div>
  );
}
