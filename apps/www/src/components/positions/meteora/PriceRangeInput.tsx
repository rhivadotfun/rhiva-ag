import DLMM from "@meteora-ag/dlmm";
import { Chart, Tooltip } from "chart.js";
import { useCallback, useMemo } from "react";
import { BarElement, CategoryScale, LinearScale } from "chart.js";
import { type BinLiquidity, getPriceOfBinByBinId } from "@meteora-ag/dlmm";

import type { getPair } from "@/lib/dex-api";
import PriceRangeInput from "../PriceRangeInput";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

type PriceRangeInputProps = {
  sides: boolean[];
  amount?: number;
  label?: string;
  value: [number, number];
  activeBin: BinLiquidity;
  liquidityRatio?: [number, number];
  curveType: "Spot" | "Curve" | "BidAsk";
  pool: Awaited<ReturnType<typeof getPair>>;
  onChange: (value: [number, number]) => void;
};

export default function MeteoraPriceRangeInput({
  pool,
  activeBin,
  ...props
}: PriceRangeInputProps) {
  const currentPrice = useMemo(() => parseFloat(activeBin.price), [activeBin]);

  const priceToIndex = useCallback(
    (price: number) => DLMM.getBinIdFromPrice(price, pool.binStep, false),
    [pool],
  );
  const indexToPrice = useCallback(
    (tick: number) => getPriceOfBinByBinId(tick, pool.binStep).toNumber(),
    [pool],
  );

  return (
    <PriceRangeInput
      {...props}
      curveType="Spot"
      pool={pool}
      currentPrice={currentPrice}
      indexToPrice={indexToPrice}
      priceToIndex={priceToIndex}
    />
  );
}
