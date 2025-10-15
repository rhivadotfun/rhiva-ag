import clsx from "clsx";
import RangeSlider from "rc-slider";
import { useMemo, useState } from "react";

type AutoFillOption = {
  label: string;
  value: [number, number];
};

type RatioInputProps = {
  tokens: { symbol: string }[];
  value: [number, number];
  onChange(value: [number, number]): void;
} & Omit<React.ComponentProps<"div">, "onChange">;

export default function RatioInput({
  value,
  tokens,
  onChange,
  ...props
}: RatioInputProps) {
  const [inputError, setInputError] = useState(false);
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
          <RangeSlider
            step={0.01}
            max={1}
            value={value[0]}
            className=" [&_.rc-slider-rail]:bg-primary"
            onChange={(value) =>
              onChange([value as number, 1 - (value as number)])
            }
          />
          <div className="flex justify-between">
            {tokens.map((token, index) => {
              const fraction = value[index];
              return (
                <p
                  key={token.symbol}
                  className="text-light"
                >
                  {Math.round(fraction * 100)}% {token.symbol}
                </p>
              );
            })}
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
          <div
            className={clsx(
              "flex border border-white/10 p-2 rounded-md",
              inputError ? "border-red-500" : "focus-within:border-primary",
            )}
          >
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
                  !values.some((value) => Number.isNaN(value)) &&
                  values.reduce((acc, cur) => acc + cur, 0) === 1
                ) {
                  setInputError(false);
                  onChange(values as [number, number]);
                } else setInputError(true);
              }}
            />
            <span className="text-nowrap text-xs text-gray">Custom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
