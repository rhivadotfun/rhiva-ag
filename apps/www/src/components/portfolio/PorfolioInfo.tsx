import clsx from "clsx";
import Decimal from "../Decimal";
import { currencyIntlArgs } from "@/constants/format";

export default function PortfolioInfo(props: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={clsx("flex flex-col space-y-4", props.className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-gray uppercase">Total Net Worth</p>
          <Decimal
            value={0.05}
            intlArgs={currencyIntlArgs}
            className="text-2xl font-semibold"
          />
        </div>
        <div className="flex items-center border border-white/10 divide-x divide-white/10 rounded overflow-hidden">
          <button
            type="button"
            className="px-2 bg-primary text-black"
          >
            USD
          </button>
          <button
            type="button"
            className="px-2"
          >
            SOL
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <p className="text-gray uppercase lt-sm:text-xs">Total Closed</p>
          <Decimal
            value={0}
            className="text-base font-medium"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-gray uppercase lt-sm:text-xs">Avg Invested</p>
          <Decimal
            value={0.05}
            intlArgs={currencyIntlArgs}
            className="text-base font-medium"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-gray uppercase lt-sm:text-xs">Total Profit</p>
          <Decimal
            value={0.05}
            intlArgs={currencyIntlArgs}
            className="text-base font-medium"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-gray uppercase lt-sm:text-xs">Expected Value</p>
          <Decimal
            value={0.05}
            intlArgs={currencyIntlArgs}
            className="text-base font-medium"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-gray uppercase lt-sm:text-xs">Win rate</p>
          <Decimal
            value={0.05}
            className="text-base font-medium"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-gray uppercase lt-sm:text-xs">Fee Earned</p>
          <Decimal
            value={0.05}
            intlArgs={currencyIntlArgs}
            className="text-base font-medium"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-gray uppercase lt-sm:text-xs">
            Avg monthly profit
          </p>
          <Decimal
            value={0.05}
            intlArgs={currencyIntlArgs}
            className="text-base font-medium"
          />
        </div>
      </div>
    </div>
  );
}
