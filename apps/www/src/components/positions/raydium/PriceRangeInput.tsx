import Decimal from "decimal.js";
import { Chart, Tooltip } from "chart.js";
import { useCallback, useMemo } from "react";
import type { Pair } from "@rhiva-ag/dex-api";
import { BarElement, CategoryScale, LinearScale } from "chart.js";
import { TickMath, SqrtPriceMath } from "@raydium-io/raydium-sdk-v2";

import PriceRangeInput from "../PriceRangeInput";
import type { getPoolState } from "@/lib/web3/raydium-patch";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

type PriceRangeInputProps = {
  pool: Pair;
  sides: boolean[];
  amount?: number;
  label?: string;
  value: [number, number];
  liquidityRatio?: [number, number];
  onChange: (value: [number, number]) => void;
  poolState: NonNullable<Awaited<ReturnType<typeof getPoolState>>>;
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
        poolState.tickSpacing,
        decimal0,
        decimal1,
      ),
    [poolState],
  );

  const indexToPrice = useCallback(
    (tick: number, decimal0: number, decimal1: number) => {
      const tickSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      return SqrtPriceMath.sqrtPriceX64ToPrice(
        tickSqrtPriceX64,
        decimal0,
        decimal1,
      ).toNumber();
    },
    [],
  );

  return (
    <PriceRangeInput
      {...props}
      pool={pool}
      curveType="Spot"
      showInput={false}
      currentPrice={currentPrice}
      indexToPrice={indexToPrice}
      priceToIndex={priceToIndex}
    />
  );
}
