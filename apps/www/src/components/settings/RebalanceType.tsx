import clsx from "clsx";
import { useMemo } from "react";

type RebalanceType = {
  value: "swap" | "swapless";
  onChange(value: "swap" | "swapless"): void;
} & React.ComponentProps<"div">;

export default function RebalanceType({
  value,
  onChange,
  ...props
}: RebalanceType) {
  const types = useMemo(
    () =>
      [
        { label: "Swap", value: "swap" },
        { label: "Swapless", value: "swapless" },
      ] as const,
    [],
  );

  return (
    <div
      {...props}
      className={clsx("flex md:space-x-8", props.className)}
    >
      {types.map((type) => {
        const selected = type.value === value;
        return (
          <button
            key={type.value}
            type="button"
            className="flex-1 flex space-x-2 p-2 cursor-pointer"
            onClick={() => onChange(type.value)}
          >
            <input
              type="radio"
              checked={selected}
              onChange={() => onChange(type.value)}
              className="pointer-events-none"
            />
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
