import RangeSlider from "rc-slider";
import { Bar } from "react-chartjs-2";
import { Chart, Tooltip } from "chart.js";
import { BarElement, CategoryScale, LinearScale } from "chart.js";

import NumberInput from "./NumberInput";
import clsx from "clsx";
import { useMemo } from "react";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

type RangeAutoFillOption = {
  label: string;
  value: [number, number];
};

type PriceRangeInputProps = {
  value: [number, number];
  onChange: (value: [number, number]) => void;
};

export default function PriceRangeInput({
  value,
  onChange,
}: PriceRangeInputProps) {
  const liquidity = [10, 20, 0, 70, 40, 50, 0, 30, 80];
  const maxLiquidity = Math.max(...liquidity);
  const relativeLiquidity = liquidity.map((value) => value / maxLiquidity);

  const autoFillOptions: RangeAutoFillOption[] = useMemo(
    () => [
      { label: "1%", value: [0.01, 0.01] },
      { label: "5%", value: [0.05, 0.05] },
      { label: "10%", value: [0.1, 0.1] },
    ],
    [],
  );

  return (
    <div className="flex flex-col space-y-4">
      <p>Price Range</p>
      <div className="flex flex-col space-y-8">
        <p className="text-center">Current Price: </p>
        <div className="relative flex flex-col max-h-48">
          <Bar
            data={{
              labels: liquidity,
              datasets: [
                {
                  data: relativeLiquidity,
                  borderSkipped: false,
                  barPercentage: 0.9,
                  categoryPercentage: 1.0,
                  backgroundColor: "#00D897",
                  stack: "stack1",
                },
                {
                  data: Array(liquidity.length).fill(1),
                  backgroundColor: "#737373",
                  borderSkipped: true,
                  barPercentage: 0.9,
                  categoryPercentage: 1.0,
                  stack: "stack1",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: "#888", font: { size: 16 } },
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
            defaultValue={[20, 80]}
            className="absolute inset-x-0 bottom-6 "
          />
        </div>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-stretch space-x-8">
            <div className="flex-1 flex  space-x-2 bg-primary/10 p-2 rounded-md">
              {autoFillOptions.map((option) => {
                const selected = value.every(
                  (value, index) => value === option.value[index],
                );

                return (
                  <button
                    key={option.label}
                    type="button"
                    className={clsx(
                      "flex-1 px-2 py-1 rounded-md",
                      selected && "bg-primary text-black",
                    )}
                    onClick={() => onChange(option.value)}
                  >
                    <span className="text-nowrap">± {option.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex-1 flex items-center space-x-2 border border-white/10 px-2 rounded-md">
              <p>Bins</p>
              <input
                className="w-full p-2 text-end"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-stretch space-x-8">
            <NumberInput label="Min Price" />
            <NumberInput label="Max Price" />
          </div>
        </div>
      </div>
    </div>
  );
}
