import clsx from "clsx";
import { useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import Image from "./Image";

type TokenInputProps = {
  value: number;
  label?: string;
  symbol: string;
  icon: string;
  balance: number;
  onSwitch?: () => void;
  onChange: (value: number) => void;
} & Omit<React.ComponentProps<"div">, "onChange">;

export default function TokenInput({
  label,
  icon,
  symbol,
  value,
  balance,
  onChange,
  onSwitch,
  ...props
}: TokenInputProps) {
  const [rawInput, setRawInput] = useState<string | number>(value ?? "");

  return (
    <div
      {...props}
      className={clsx(
        "flex flex-col space-y-2 bg-primary/5 border border-primary/10 backdrop-blur-3xl rounded-md p-4 focus-within:border-primary",
        props.className,
      )}
    >
      <div className="flex items-center">
        <p className="text-gray">{label}</p>
        <div></div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          className="flex items-center space-x-2 bg-primary/10 px-2 py-2 rounded-md"
          onClick={onSwitch}
        >
          <Image
            src={icon}
            width={24}
            height={24}
            alt={symbol}
            className="size-6 rounded-full"
          />
          <p className="font-medium">{symbol}</p>
          <IoChevronDown />
        </button>
        <input
          value={rawInput}
          placeholder="0"
          className="w-full flex-1 bg-transparent text-2xl text-end font-medium border-none"
          onChange={(event) => {
            const raw = event.target.value;
            setRawInput(raw);
            const value = parseFloat(raw);
            if (!Number.isNaN(value)) onChange(value);
          }}
        />
      </div>
      <p className="text-gray text-xs">Balance: {balance}</p>
    </div>
  );
}
