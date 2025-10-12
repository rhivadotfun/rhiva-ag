import clsx from "clsx";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Decimal from "../Decimal";
import Link from "next/link";
import { format } from "util";
import type { DexApi } from "@rhiva-ag/dex-api";
import { percentageIntlArgs } from "@/constants/format";

type TokenSortProps = {
  data: Pick<
    Awaited<ReturnType<DexApi["jup"]["token"]["list"]>>[number],
    "stats5m" | "stats1h" | "stats6h" | "stats24h"
  >;
} & React.ComponentPropsWithoutRef<"div">;

export default function TokenTab({ data, ...props }: TokenSortProps) {
  const searchParams = useSearchParams();
  const timeframe = searchParams.get("timeframe");

  const tabs = useMemo(
    () => [
      {
        title: "5M",
        value: "stats5m",
        priceChange: data.stats5m.priceChange,
      },
      {
        title: "1H",
        value: "stats1h",
        priceChange: data.stats1h.priceChange,
      },
      {
        title: "6H",
        value: "stats6h",
        priceChange: data.stats6h.priceChange,
      },
      {
        title: "24H",
        value: null,
        priceChange: data.stats24h.priceChange,
      },
    ],
    [data],
  );

  return (
    <div
      {...props}
      className={clsx(
        props.className,
        "flex  divide-x divide-white/10 border border-white/10 rounded-md overflow-hidden",
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.value === timeframe;
        const urlSearchParams = new URLSearchParams(searchParams);
        if (selected || !tab.value) urlSearchParams.delete("timeframe");
        else if (tab.value) urlSearchParams.set("timeframe", tab.value);

        return (
          <Link
            key={tab.value}
            href={format("?%s", urlSearchParams.toString())}
            className={clsx(
              "flex-1 flex items-center space-x-2 px-2 py-1 md:flex-col lg:flex-row",
              tab.priceChange && tab.priceChange > 0
                ? "text-primary"
                : "  text-red-500",
              selected && "bg-primary/20",
            )}
          >
            <span className="text-white">{tab.title}</span>&nbsp;
            {tab.priceChange !== undefined && (
              <Decimal
                as="small"
                disableTruncate
                value={tab.priceChange}
                intlArgs={percentageIntlArgs}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
