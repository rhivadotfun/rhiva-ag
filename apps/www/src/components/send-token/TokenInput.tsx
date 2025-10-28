import { currencyIntlArgs } from "@/constants/format";
import Decimal from "../Decimal";

type TokenInputProps = {
  value?: number | string;
  amount: number;
  priceUsd: number;
  symbol: string;
  onChange: (value: number) => void;
};

export default function TokenInput({
  amount,
  priceUsd,
  symbol,
  value = 0,
  onChange,
}: TokenInputProps) {
  return (
    <div className="flex justify-between">
      <div className="flex-1 overflow-x-scroll">
        <div className="flex items-end space-x-2">
          <div
            itemType="number"
            datatype="decimal"
            defaultValue={0}
            contentEditable
            data-placeholder="0"
            className="text-4xl font-medium focus:outline-none"
            onInput={(event) => {
              const value = (event.target as HTMLDivElement).innerHTML;
              const num = parseFloat(value);
              onChange(Number.isNaN(num) ? 0 : num);
            }}
          />
          <span className="text-gray">{symbol}</span>
        </div>
        {value !== undefined && (
          <Decimal
            value={priceUsd * Number(value)}
            intlArgs={currencyIntlArgs}
            className="text-sm text-gray font-semibold"
          />
        )}
      </div>
      <div className="flex flex-col items-end space-y-1">
        <button
          type="button"
          className="bg-primary/10 text-light px-3 py-0.5 text-xs rounded"
        >
          Max
        </button>
        <p className="text-gray">
          <Decimal
            value={amount}
            minValue={0.01}
          />
          {symbol}
        </p>
      </div>
    </div>
  );
}
