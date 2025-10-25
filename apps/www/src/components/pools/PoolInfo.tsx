import clsx from "clsx";
import { useMemo } from "react";
import { FaLeaf } from "react-icons/fa6";

import Image from "../Image";
import Decimal from "../Decimal";
import { PoolAddressToolTip } from "../AddressTooltip";
import { currencyIntlArgs, percentageIntlArgs } from "@/constants/format";

type TokenInfo = {
  id: string;
  name: string;
  amount: number;
  image: string;
  score: number;
};
type PoolInfoProps = {
  tvl?: number;
  apr: number;
  tokens: TokenInfo[];
};

export default function PoolInfo({ tvl, apr, tokens }: PoolInfoProps) {
  const intl = useMemo(() => new Intl.NumberFormat("en-US"), []);
  const compactIntl = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
        compactDisplay: "short",
      }),
    [],
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
    <div className="flex flex-col space-y-8 lt-sm:bg-white/3 lt-sm:p-4 lt-sm:rounded-xl sm:space-y-16 ">
      <div className="flex justify-between">
        {tvl && (
          <div className="flex flex-col">
            <p className="text-gray">Total Value Locked</p>
            <Decimal
              value={tvl}
              intlArgs={currencyIntlArgs}
              className="text-xl font-medium"
            />
          </div>
        )}
        <div>
          <span>APR </span>
          <span className={clsx(apr > 0 ? "text-primary" : "text-red-500")}>
            {percentageIntl.format(apr)}
          </span>
        </div>
      </div>
      <div className="flex flex-col space-y-4 sm:bg-white/3 sm:rounded-md sm:p-4">
        <p className="text-gray">Liquidity Allocation</p>
        <div className="flex flex-col space-y-4">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex  items-center space-x-2"
            >
              <Image
                src={token.image}
                width={32}
                height={32}
                alt={token.name}
                className="rounded-full"
              />
              <div className="flex-1 flex flex-wrap items-center gap-2">
                <div className="flex-1 flex flex-col space-y-2">
                  <div className="flex items-center space-x-4">
                    <p className="text-base font-medium">{token.name}</p>
                    <PoolAddressToolTip address={token.id} />
                  </div>
                  <div
                    className={clsx(
                      "flex items-center space-x-1 text-xs",
                      token.score > 75
                        ? "text-primary"
                        : token.score > 50
                          ? "text-gray"
                          : "text-red-500",
                    )}
                  >
                    <FaLeaf />
                    <span
                      className={clsx(
                        "border-b border-dashed",
                        token.score > 75
                          ? "border-primary"
                          : token.score > 50
                            ? "border-gray"
                            : "border-red-500",
                      )}
                    >
                      score: {percentageIntl.format(token.score)}
                    </span>
                  </div>
                </div>
                <span className="lt-xl:hidden">
                  {intl.format(token.amount)}
                </span>
                <span className="xl:hidden">
                  {compactIntl.format(token.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
