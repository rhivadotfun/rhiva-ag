import clsx from "clsx";
import RangeSlider from "rc-slider";
import { useMemo } from "react";

type AutoFillOption = {
  label: string;
  value: [number, number];
};

type RatioInputProps = {
  value: [number, number];
  onChange(value: [number, number]): void;
} & React.ComponentProps<"div">;

export default function RatioInput({
  value,
  onChange,
  ...props
}: RatioInputProps) {
  const autoFillOptions: AutoFillOption[] = useMemo(
    () => [
      { label: "50:50", value: [0.5, 0.5] },
      { label: "75:25", value: [0.75, 0.25] },
      { label: "40:60", value: [0.4, 0.6] },
    ],
    [],
  );

  return (
    <div
      {...props}
      className={clsx("flex flex-col space-y-2", props.className)}
    >
      <p className="text-light-secondary">Liquidity Ratio %</p>
      <div className="flex flex-col space-y-1">
        <div className="flex flex-col">
          <RangeSlider className="max-w-full [&_.rc-slider-rail]:bg-primary" />
          <div className="flex justify-between">
            <p className="text-light">50% SOL</p>
            <p className="text-light">50% USDC</p>
          </div>
        </div>
        <div className="flex items-center justify-between space-x-8">
          <div className="flex items-center space-x-2">
            {autoFillOptions.map((option) => {
              const selected = value.every(
                (value, index) => value === option.value[index],
              );

              return (
                <button
                  key={option.label}
                  type="button"
                  className={clsx(
                    "px-1 py-1 border border-white/10 text-xs  rounded",
                    selected ? "bg-primary/10" : " text-light",
                  )}
                  onClick={() => onChange(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex border border-white/10 p-2 rounded-md focus-within:border-primary">
            <input
              placeholder="50:50"
              className="w-full placeholder-text-gray"
              onChange={(event) => {
                const values = event.target.value
                  .split(/:/g)
                  .map(parseFloat)
                  .map((value) => value / 100);
                if (
                  values.length > 1 &&
                  !values.some((value) => Number.isNaN(value))
                )
                  onChange(values as [number, number]);
              }}
            />
            <span className="text-nowrap text-xs text-gray">Custom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
