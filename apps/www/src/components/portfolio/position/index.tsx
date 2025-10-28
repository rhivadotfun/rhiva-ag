import { useMemo } from "react";
import { TabPanel } from "@headlessui/react";
import { useSearchParams } from "next/navigation";
import { NATIVE_MINT } from "@solana/spl-token";
import { useQuery } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import DexSwitchTab from "./DexSwitchTab";
import OpenPositionTable from "./OpenPositionTable";
import ClosedPositionTable from "./ClosedPositionTable";

export default function PortfolioPositionTab() {
  const searchParams = useSearchParams();
  const nativeMint = NATIVE_MINT.toBase58();

  const { data } = useQuery({
    queryKey: ["tokens", "price", nativeMint],
    queryFn: () => dexApi.jup.price.getPrices(nativeMint),
  });

  const isNative = useMemo(
    () => searchParams.get("currency") === "native",
    [searchParams],
  );
  const nativePrice = useMemo(
    () => (data ? data[NATIVE_MINT.toBase58()].usdPrice : 0),
    [data],
  );

  return (
    <TabPanel className="flex-1 flex flex-col space-y-4">
      <DexSwitchTab />
      <div className="flex-1 flex flex-col space-y-2">
        <OpenPositionTable
          isNative={isNative}
          nativePrice={nativePrice}
        />
        <ClosedPositionTable
          isNative={isNative}
          nativePrice={nativePrice}
        />
      </div>
    </TabPanel>
  );
}
