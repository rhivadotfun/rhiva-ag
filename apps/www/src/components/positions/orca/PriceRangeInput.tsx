import { Chart, Tooltip } from "chart.js";
import { useCallback, useMemo } from "react";
import type { Account, Address } from "@solana/kit";
import type { Whirlpool } from "@orca-so/whirlpools-client";
import { BarElement, CategoryScale, LinearScale } from "chart.js";
import {
  tickIndexToPrice,
  priceToTickIndex,
} from "@orca-so/whirlpools-core/dist/browser/orca_whirlpools_core_js_bindings";

import type { getPair } from "@/lib/web3/dex-api";
import PriceRangeInput from "../PriceRangeInput";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

type PriceRangeInputProps = {
  sides: boolean[];
  amount?: number;
  label?: string;
  showInput?: boolean;
  value: [number, number];
  liquidityRatio?: [number, number];
  whirlpool: Account<Whirlpool, Address>;
  pool: Awaited<ReturnType<typeof getPair>>;
  onChange: (value: [number, number]) => void;
};

export default function OrcaPriceRangeInput({
  pool,
  whirlpool,
  ...props
}: PriceRangeInputProps) {
  const currentPrice = useMemo(
    () =>
      tickIndexToPrice(
        whirlpool.data.tickCurrentIndex,
        pool.baseToken.decimals,
        pool.quoteToken.decimals,
      ),
    [whirlpool, pool],
  );

  const priceToIndex = useCallback(
    (price: number, decimal0: number, decimal1: number) =>
      priceToTickIndex(price, decimal0, decimal1),
    [],
  );
  const indexToPrice = useCallback(
    (tick: number, decimal0: number, decimal1: number) =>
      tickIndexToPrice(tick, decimal0, decimal1),
    [],
  );

  return (
    <PriceRangeInput
      {...props}
      curveType="Spot"
      pool={pool}
      showInput={false}
      currentPrice={currentPrice}
      indexToPrice={indexToPrice}
      priceToIndex={priceToIndex}
    />
  );
}
