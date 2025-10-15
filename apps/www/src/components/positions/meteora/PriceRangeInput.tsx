import clsx from "clsx";
import { format } from "util";
import RangeSlider from "rc-slider";
import { Bar } from "react-chartjs-2";
import type DLMM from "@meteora-ag/dlmm";
import { Chart, Tooltip } from "chart.js";
import type { BinLiquidity } from "@meteora-ag/dlmm";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarElement, CategoryScale, LinearScale } from "chart.js";

import Decimal from "../../Decimal";
import NumberInput from "../../NumberInput";
import type { getPair } from "@/lib/dex-api";
import { generateLiquidityDistribution } from "@/lib";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

type RangeAutoFillOption = {
  label: string;
  value: [number, number];
};

type PriceRangeInputProps = {
  sides: boolean[];
  curveType: "Spot" | "Curve" | "BidAsk";
  amount?: number;
  dlmm: DLMM;
  pool: Awaited<ReturnType<typeof getPair>>;
  label?: string;
  showInput?: boolean;
  value: [number, number];
  activeBin: BinLiquidity;
  liquidityRatio?: [number, number];
  onChange: (value: [number, number]) => void;
};

export default function PriceRangeInput({
  dlmm,
  amount = 0,
  label,
  onChange,
  pool,
  activeBin,
  value,
  sides,
  liquidityRatio,
  curveType = "Spot",
  showInput = true,
}: PriceRangeInputProps) {
  const [lowerPriceChange, upperPriceChange] = value;
  const [binStep, setBinStep] = useState(69);
  const [minPrice, setMinPrice] = useState(() => {
    const price = parseFloat(activeBin.price);
    return price + price * lowerPriceChange;
  });
  const [maxPrice, setMaxPrice] = useState(() => {
    const price = parseFloat(activeBin.price);
    return price + price * upperPriceChange;
  });

  const intl = useMemo(() => new Intl.NumberFormat(), []);
  const currentPrice = useMemo(() => parseFloat(activeBin.price), [activeBin]);
  const priceStep = useMemo(() => {
    return currentPrice * (pool.binStep / 10_000);
  }, [pool, currentPrice]);
  const autoFillOptions: RangeAutoFillOption[] = useMemo(
    () => [
      { label: "1%", value: [0.01, 0.01] },
      { label: "5%", value: [0.05, 0.05] },
      { label: "10%", value: [0.1, 0.1] },
    ],
    [],
  );

  const liquidities = useMemo(
    () => generateLiquidityDistribution(amount, binStep, curveType),
    [binStep, amount, curveType],
  );
  const maxLiquidity = useMemo(() => Math.max(...liquidities), [liquidities]);
  const relativeLiquidities = useMemo(
    () => liquidities.map((value) => value / maxLiquidity),
    [liquidities, maxLiquidity],
  );
  const labels = useMemo(() => {
    const delta = (maxPrice - minPrice) / liquidities.length;
    const labels = [];
    for (let index = 0; index < liquidities.length; index++)
      labels.push((minPrice + index * delta).toPrecision(4));
    return labels;
  }, [maxPrice, minPrice, liquidities]);

  const onMinPriceChange = useCallback(
    (price: number) => {
      const lowerPriceChange = (currentPrice - price) / currentPrice;
      const priceChanges: [number, number] = [
        -lowerPriceChange,
        upperPriceChange,
      ];
      setMinPrice(price);
      onChange(priceChanges);
    },
    [currentPrice, upperPriceChange, onChange],
  );

  const onMaxPriceChange = useCallback(
    (price: number) => {
      const upperPriceChange = (price - currentPrice) / currentPrice;
      const priceChanges: [number, number] = [
        lowerPriceChange,
        upperPriceChange,
      ];
      setMaxPrice(price);
      onChange(priceChanges);
    },
    [currentPrice, lowerPriceChange, onChange],
  );

  const onPriceChange = useCallback(
    ([lowerPriceChange, upperPriceChange]: [number, number]) => {
      const minPrice = currentPrice + currentPrice * lowerPriceChange;
      const maxPrice = currentPrice + currentPrice * upperPriceChange;

      setMinPrice(minPrice);
      setMaxPrice(maxPrice);
      onChange([lowerPriceChange, upperPriceChange]);
    },
    [currentPrice, onChange],
  );

  useEffect(() => {
    const currentPrice = parseFloat(activeBin.price);
    const minPrice = currentPrice + currentPrice * lowerPriceChange;
    const maxPrice = currentPrice + currentPrice * upperPriceChange;
    const binIds = [
      dlmm.getBinIdFromPrice(minPrice, true),
      dlmm.getBinIdFromPrice(maxPrice, false),
    ];
    const minBinId = Math.min(...binIds);
    const maxBinId = Math.max(...binIds);
    const binStep = maxBinId - minBinId;
    setBinStep(binStep);
    setMaxPrice(maxPrice);
    setMinPrice(minPrice);
  }, [activeBin, dlmm, lowerPriceChange, upperPriceChange]);

  return (
    <div className="flex flex-col space-y-2">
      {label && <p className="text-light-secondary">Price Range</p>}
      <div className="flex flex-col space-y-4 sm:space-y-8">
        <p className="text-xs text-white/75 text-center">
          Current Price: <Decimal value={activeBin.price} />
          &nbsp;
          {pool.baseToken.symbol}/{pool.quoteToken.symbol}
        </p>
        <div className="relative flex flex-col max-h-24 sm:max-h-48">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  data: relativeLiquidities,
                  categoryPercentage: 1.0,
                  backgroundColor: (ctx) => {
                    if (liquidityRatio) {
                      const index = ctx.dataIndex;
                      const dataLength = ctx.dataset.data.length;
                      const [left] = liquidityRatio;
                      const leftMax = Math.floor(dataLength * left);

                      return index <= leftMax ? "#00D897" : "#6A0DAD";
                    }
                    const index = ctx.dataIndex;
                    const dataLength = ctx.dataset.data.length;
                    const midpoint = dataLength / 2;
                    const sideIndex = Math.floor(index / midpoint);
                    const enabled = sides[sideIndex];
                    return enabled ? "#00D897" : "#737373";
                  },
                },
                {
                  data: Array(liquidities.length).fill(1),
                  backgroundColor: "#737373",
                  borderSkipped: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  displayColors: false,
                  titleColor: "red",
                  footerColor: "red",
                  callbacks: {
                    title: () => "",
                    label: (ctx) => [
                      "Price",
                      intl.format(parseFloat(ctx.label)),
                    ],
                    afterLabel: (ctx) => {
                      const tokens = [pool.baseToken, pool.quoteToken];

                      if (liquidityRatio) {
                        const index = ctx.dataIndex;
                        const dataLength = ctx.dataset.data.length;
                        const [left] = liquidityRatio;
                        const leftMax = Math.floor(dataLength * left);
                        const sideIndex = index <= leftMax ? 0 : 1;
                        const token = tokens[sideIndex];

                        return format(
                          "%s %s",
                          intl.format(liquidities[index]),
                          token.symbol,
                        );
                      }

                      const index = ctx.dataIndex;
                      const dataLength = ctx.dataset.data.length;
                      const midpoint = dataLength / 2;
                      const sideIndex = Math.floor(index / midpoint);
                      const token = tokens[sideIndex];
                      return format(
                        "%s %s",
                        intl.format(liquidities[index]),
                        token.symbol,
                      );
                    },
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    maxRotation: 0,
                    color: "#888",
                    font: { size: 12 },
                  },
                  stacked: true,
                },
                y: {
                  min: 0,
                  max: 1,
                  stacked: true,
                  grid: { display: false },
                  ticks: { display: false },
                },
              },
            }}
          />
          <RangeSlider
            range
            max={1}
            step={0.1}
            value={value}
            onChange={(value) => onChange(value as [number, number])}
            className="absolute inset-x-0 bottom-5"
          />
        </div>
        <div className="flex flex-col space-y-4">
          <div
            className={clsx(
              "flex items-center space-x-8",
              showInput && "justify-stretch",
            )}
          >
            <div
              className={clsx(
                "flex space-x-2 bg-primary/10 p-2 rounded-md",
                showInput && "flex-1",
              )}
            >
              {autoFillOptions.map((option) => {
                const selected = value.every(
                  (value, index) => value === option.value[index],
                );

                return (
                  <button
                    key={option.label}
                    type="button"
                    className={clsx(
                      "flex-1 text-xs px-2 py-1 rounded-md",
                      selected ? "bg-primary text-black" : "text-light",
                    )}
                    onClick={() => onPriceChange(option.value)}
                  >
                    <span className="text-nowrap">± {option.label}</span>
                  </button>
                );
              })}
            </div>
            {showInput && (
              <div className="flex-1 flex items-center space-x-2 border border-white/10 px-2 rounded-md focus-within:border-primary">
                <p className="lt-sm:text-xs">Bins</p>
                <input
                  type="number"
                  placeholder="0"
                  value={binStep}
                  disabled
                  className="w-full p-2 text-end"
                />
              </div>
            )}
          </div>
          <div className="flex justify-stretch space-x-8">
            <NumberInput
              label="Min Price"
              value={minPrice}
              step={priceStep}
              onChange={onMinPriceChange}
            />
            <NumberInput
              label="Max Price"
              value={maxPrice}
              step={priceStep}
              onChange={onMaxPriceChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
