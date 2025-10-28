import clsx from "clsx";
import { useMemo } from "react";

import Decimal from "../Decimal";
import {
  compactCurrencyIntlArgs,
  currencyIntlArgs,
  percentageIntlArgs,
} from "@/constants/format";

type PoolAnalyticProps = {
  binStep: number;
  baseFee: number;
  maxFee?: number;
  dynamicFee?: number;
  liquidity: number;
  fees24h?: number;
  fees7d?: number;
  volume?: number;
  price?: number;
} & React.ComponentProps<"div">;

export default function PoolAnalytic({
  liquidity,
  fees24h,
  fees7d,
  volume,
  price,
  binStep,
  baseFee,
  maxFee,
  ...props
}: PoolAnalyticProps) {
  const currencyIntl = new Intl.NumberFormat("en-US", currencyIntlArgs);
  const compactCurrencyIntl = new Intl.NumberFormat(
    "en-US",
    compactCurrencyIntlArgs,
  );
  const percentageIntl = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        ...percentageIntlArgs,
        signDisplay: "never",
      }),
    [],
  );

  return (
    <div
      {...props}
      className={clsx("flex flex-col space-y-4 sm:space-y-8", props.className)}
    >
      <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-2">
        <div className="flex flex-col lt-sm:text-xs">
          <p className="text-gray">Current Liquidity</p>
          <span className="lt-sm:hidden sm:text-base">
            {currencyIntl.format(liquidity)}
          </span>
          <span className="sm:hidden">
            {compactCurrencyIntl.format(liquidity)}
          </span>
        </div>
        <div className="flex flex-col sm:text-end">
          <p className="text-gray lt-sm:text-xs">Market Cap</p>
          <Decimal
            value={0}
            intlArgs={currencyIntlArgs}
            className="sm:text-base"
          />
        </div>
        {volume && (
          <div className="flex flex-col lt-sm:text-end ">
            <p className="text-gray lt-sm:text-xs">Volume 24h</p>
            <Decimal
              value={volume}
              intlArgs={compactCurrencyIntlArgs}
              className="sm:text-base"
            />
          </div>
        )}
        {fees24h && (
          <div className="flex flex-col sm:text-end">
            <p className="text-gray lt-sm:text-xs">Fees 24h</p>
            <span className="lt-sm:hidden sm:text-base">
              {currencyIntl.format(fees24h)}
            </span>
            <span className="sm:hidden">
              {compactCurrencyIntl.format(fees24h)}
            </span>
          </div>
        )}
        {price && (
          <div className="flex flex-col">
            <p className="text-gray lt-sm:text-xs">Price</p>
            <Decimal
              value={price}
              className="sm:text-base"
            />
          </div>
        )}
        {fees7d && (
          <div className="flex flex-col lt-sm:text-end sm:text-end">
            <p className="text-gray lt-sm:text-xs">Fees 7d</p>
            <span className="lt-sm:hidden sm:text-base">
              {currencyIntl.format(fees7d)}
            </span>
            <span className="sm:hidden">
              {compactCurrencyIntl.format(fees7d)}
            </span>
          </div>
        )}
      </div>
      <div className="flex backdrop-blur sm:grid sm:grid-cols-2 sm:gap-4 sm:bg-white/3 sm:p-4 sm:rounded-md">
        <div className="lt-sm:flex-1 lt-sm:flex lt-sm:flex-col">
          <span className="text-gray lt-sm:text-xs sm:after:content-[':_']">
            Bin Step
          </span>
          <span>{binStep}</span>
        </div>
        <div className="lt-sm:flex-1 lt-sm:flex lt-sm:flex-col sm:justify-self-end">
          <span className="text-gray lt-sm:text-xs sm:after:content-[':_']">
            Base Fee
          </span>
          <span>{percentageIntl.format(baseFee)}</span>
        </div>
        {maxFee && (
          <div className="lt-sm:flex-1 lt-sm:flex lt-sm:flex-col lt-sm:text-end">
            <span className="text-gray lt-sm:text-xs sm:after:content-[':_']">
              Max Fee
            </span>
            <span>{percentageIntl.format(maxFee)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
