import Decimal from "decimal.js";
import { Chart, Tooltip } from "chart.js";
import { useCallback, useMemo } from "react";
import { TickMath } from "@raydium-io/raydium-sdk-v2";
import { BarElement, CategoryScale, LinearScale } from "chart.js";

import type { getPair } from "@/lib/dex-api";
import PriceRangeInput from "../PriceRangeInput";
import type { getPoolState } from "@/lib/raydium-patch";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

type PriceRangeInputProps = {
  sides: boolean[];
  amount?: number;
  label?: string;
  value: [number, number];
  liquidityRatio?: [number, number];
  pool: Awaited<ReturnType<typeof getPair>>;
  onChange: (value: [number, number]) => void;
  poolState: Awaited<ReturnType<typeof getPoolState>>;
};

export default function RaydiumPriceRangeInput({
  pool,
  poolState,
  ...props
}: PriceRangeInputProps) {
  const currentPrice = useMemo(() => poolState.currentPrice, [poolState]);

  const priceToIndex = useCallback(
    (price: number, decimal0: number, decimal1: number) =>
      TickMath.getTickWithPriceAndTickspacing(
        new Decimal(price),
        pool.binStep,
        decimal0,
        decimal1,
      ),
    [pool],
  );

  return (
    <PriceRangeInput
      {...props}
      pool={pool}
      curveType="Spot"
      showInput={false}
      currentPrice={currentPrice}
      priceToIndex={priceToIndex}
    />
  );
}
