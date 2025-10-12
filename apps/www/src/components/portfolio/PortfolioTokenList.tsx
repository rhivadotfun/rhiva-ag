import clsx from "clsx";
import { useMemo, useState } from "react";

import Image from "../Image";
import Decimal from "../Decimal";
import type { getWalletPNL } from "@/lib/get-tokens";
import { currencyIntlArgs, percentageIntlArgs } from "@/constants/format";

type PortfolioTokenListProps = {
  tokens: Awaited<ReturnType<typeof getWalletPNL>>["tokens"];
};

export default function PortfolioTokenList({
  tokens,
}: PortfolioTokenListProps) {
  return (
    <>
      <div className="lt-sm:hidden"></div>
      <PortfolioTokenListSmall
        tokens={tokens}
        className="sm:hidden"
      />
    </>
  );
}

function PortfolioTokenListSmall({
  tokens,
  ...props
}: React.ComponentProps<"div"> & PortfolioTokenListProps) {
  const [hideZeroBalance, setHideZeroBalance] = useState(true);
  const percentageIntl = useMemo(
    () => new Intl.NumberFormat("en-US", percentageIntlArgs),
    [],
  );

  const filterTokens = useMemo(
    () =>
      hideZeroBalance ? tokens.filter((token) => token.balance !== 0) : tokens,
    [hideZeroBalance, tokens],
  );

  return (
    <div
      {...props}
      className={clsx("flex flex-col space-y-2", props.className)}
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold">Tokens</p>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="accent-primary"
            checked={hideZeroBalance}
            onChange={(event) => setHideZeroBalance(event.target.checked)}
          />
          <span>Hide zero balance</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {filterTokens.map((token) => (
          <div
            key={token.id}
            className="flex justify-between p-2"
          >
            <div className="flex items-center space-x-2">
              <Image
                src={token.icon}
                width={32}
                height={32}
                alt={token.symbol}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <p className="text-base text-medium">{token.name}</p>
                <div className="flex space-x-2">
                  <Decimal
                    value={token.usdPrice}
                    intlArgs={currencyIntlArgs}
                    className="text-gray"
                  />
                  <p
                    className={clsx(
                      token.stats24h.priceChange < 0
                        ? "text-red-500"
                        : "text-primary",
                    )}
                  >
                    {percentageIntl.format(token.stats24h.priceChange)}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-end">
              <Decimal
                value={token.balance * token.usdPrice}
                intlArgs={currencyIntlArgs}
                minValue={0.01}
              />
              <p className="text-gray">
                <Decimal value={token.balance} /> {token.symbol}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
