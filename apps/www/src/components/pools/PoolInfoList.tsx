import clsx from "clsx";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc.client";
import { compactCurrencyIntlArgs } from "@/constants/format";

export default function PoolInfoList(props: React.ComponentProps<"div">) {
  const trpc = useTRPC();
  const compactIntl = useMemo(
    () => new Intl.NumberFormat("en-US", compactCurrencyIntlArgs),
    [],
  );
  const intl = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const { data } = useQuery(trpc.pool.analytics.queryOptions());

  if (data) {
    const poolInfos = [
      { title: "TVL", value: data.tvl },
      { title: "24H Volume", value: data.volume },
      { title: "24H Fees", value: data.fees },
    ];

    return (
      <div
        {...props}
        className={clsx("flex space-x-2 backdrop-blur", props.className)}
      >
        {poolInfos.map((poolInfo) => (
          <div
            key={poolInfo.title}
            className="flex-1 bg-white/5 px-4 py-3 rounded-md"
          >
            <p className="text-xs text-gray">{poolInfo.title}</p>
            <p className="lt-sm:hidden">{intl.format(poolInfo.value)}</p>
            <p className="sm:hidden">{compactIntl.format(poolInfo.value)}</p>
          </div>
        ))}
      </div>
    );
  }
}
