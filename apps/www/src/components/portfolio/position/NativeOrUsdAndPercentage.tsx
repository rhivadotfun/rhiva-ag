import clsx from "clsx";
import { format } from "util";
import { useMemo, useState } from "react";

import Image from "@/components/Image";
import Decimal from "@/components/Decimal";
import { DefaultToken } from "@/constants/tokens";
import { currencyIntlArgs, percentageIntlArgs } from "@/constants/format";

type NativeOrUsdAndPerentageProps = {
  colorize?: boolean;
  nativePrice: number;
  isNative?: boolean;
  usdValue?: number;
  nativeValue?: number;
  percentageValue?: number;
  showNativeIcon?: boolean;
};

export default function NativeOrUsdAndPerentageValue({
  isNative,
  colorize,
  nativePrice,
  showNativeIcon,
  percentageValue,
  ...props
}: NativeOrUsdAndPerentageProps) {
  const percentageIntl = useMemo(
    () => new Intl.NumberFormat("en-US", percentageIntlArgs),
    [],
  );

  const [nativeValue] = useState(() => {
    if (props.nativeValue) return props.nativeValue;
    if (props.usdValue) return props.usdValue / nativePrice;
    return 0;
  });

  const [usdValue] = useState(() => {
    if (props.usdValue) return props.usdValue;
    if (props.nativeValue) return props.nativeValue * nativePrice;
    return 0;
  });

  const isPostiveValue = useMemo(
    () => usdValue >= -1 || nativePrice > -1,
    [usdValue, nativePrice],
  );

  const isPostivePercentage = useMemo(
    () => percentageValue != null && percentageValue > -1,
    [percentageValue],
  );

  return (
    <div>
      {isNative ? (
        <div className="flex items-center space-x-2">
          <Decimal
            as="p"
            value={nativeValue}
            suffix={
              showNativeIcon
                ? undefined
                : format(" %s", DefaultToken.Sol.symbol)
            }
            className={clsx(
              "text-nowrap",
              colorize && (isPostiveValue ? "text-primary" : "text-red-500"),
            )}
          />
          {showNativeIcon && (
            <Image
              src={DefaultToken.Sol.icon}
              width={16}
              height={16}
              alt={DefaultToken.Sol.symbol}
            />
          )}
        </div>
      ) : (
        <Decimal
          as="p"
          value={usdValue}
          intlArgs={currencyIntlArgs}
        />
      )}
      {percentageValue != null && (
        <span
          className={clsx(
            colorize && (isPostivePercentage ? "text-primary" : "text-red-500"),
          )}
        >
          {percentageIntl.format(percentageValue)}
        </span>
      )}
    </div>
  );
}
