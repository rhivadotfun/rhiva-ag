import clsx from "clsx";
import { useMemo } from "react";

type BarProgressProps = {
  levels?: number;
  max?: number;
  value: number;
};

export default function BarProgress({
  value,
  max = 10,
  levels = 3,
}: BarProgressProps) {
  const level = useMemo(
    () => Math.ceil(value / (max / levels)),
    [value, max, levels],
  );
  return (
    <div className="flex space-x-0.5 items-end">
      {Array.from({ length: levels }).map((_, index) => {
        const selected = index < level;
        return (
          <div
            key={index.toString()}
            style={{ height: (index + 1) * 4 }}
            className={clsx(
              "w-1 rounded-xl",
              selected
                ? level < Math.ceil(levels / 2)
                  ? "bg-primary"
                  : "bg-red-500"
                : "bg-white/75",
            )}
          />
        );
      })}
    </div>
  );
}
