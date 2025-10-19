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
      {/* Desktop Table Layout */}
      <PortfolioTokenListDesktop
        tokens={tokens}
        className="hidden lg:block md:border border-white/20 p-3 rounded"
      />
      {/* Mobile Compact Layout */}
      <PortfolioTokenListMobile
        tokens={tokens}
        className="md:hidden"
      />
    </>
  );
}

function PortfolioTokenListDesktop({
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
      className={clsx("flex flex-col space-y-4", props.className)}
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

      {/* Desktop Table */}
      <div className="w-full">
        {/* Table Headers */}
        <div className="grid grid-cols-3 gap-4 pb-2 border-b border-white/10">
          <div className="text-gray text-sm font-medium">TOKEN NAME</div>
          <div className="text-gray text-sm font-medium text-center">
            PRICE/24H CHANGE
          </div>
          <div className="text-gray text-sm font-medium text-right">
            BALANCE
          </div>
        </div>

        {/* Table Rows */}
        <div className="flex flex-col">
          {filterTokens.map((token) => (
            <div
              key={token.id}
              className="grid grid-cols-3 gap-4 py-3 border-b border-white/5 last:border-b-0"
            >
              {/* Column 1: Token Name */}
              <div className="flex items-center space-x-3">
                <Image
                  src={token.icon}
                  width={40}
                  height={40}
                  alt={token.symbol}
                  className="rounded-full"
                />
                <div className="flex flex-col">
                  <p className="text-base font-medium">{token.name}</p>
                  <p className="text-gray text-sm">{token.symbol}</p>
                </div>
              </div>

              {/* Column 2: Price/24H Change */}
              <div className="flex flex-col items-center justify-center">
                <Decimal
                  value={token.usdPrice}
                  intlArgs={currencyIntlArgs}
                  className="text-base font-medium"
                />
                <p
                  className={clsx(
                    "text-sm font-semibold",
                    token.stats24h.priceChange < 0
                      ? "text-red-500"
                      : "text-green-500",
                  )}
                >
                  {percentageIntl.format(token.stats24h.priceChange)}
                </p>
              </div>

              {/* Column 3: Balance */}
              <div className="flex flex-col items-end justify-center">
                <Decimal
                  value={token.balance * token.usdPrice}
                  intlArgs={currencyIntlArgs}
                  minValue={0.01}
                  className="text-base font-medium"
                />
                <p className="text-gray text-sm">
                  <Decimal value={token.balance} /> {token.symbol}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PortfolioTokenListMobile({
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
      className={clsx("flex flex-col space-y-3", props.className)}
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
          <span className="text-sm">Hide zero balance</span>
        </div>
      </div>

      {/* Mobile Compact List */}
      <div className="flex flex-col space-y-2">
        {filterTokens.map((token) => (
          <div
            key={token.id}
            className="flex items-center justify-between p-3 border border-white/5 rounded-lg bg-white/5"
          >
            {/* Left side: Icon, Name, Price + Change */}
            <div className="flex items-center space-x-3">
              <Image
                src={token.icon}
                width={36}
                height={36}
                alt={token.symbol}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <p className="text-base font-medium">{token.name}</p>
                <div className="flex items-center space-x-2">
                  <Decimal
                    value={token.usdPrice}
                    intlArgs={currencyIntlArgs}
                    className="text-gray text-sm"
                  />
                  <p
                    className={clsx(
                      "text-sm font-semibold",
                      token.stats24h.priceChange < 0
                        ? "text-red-500"
                        : "text-green-500",
                    )}
                  >
                    {percentageIntl.format(token.stats24h.priceChange)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Balance */}
            <div className="text-right">
              <Decimal
                value={token.balance * token.usdPrice}
                intlArgs={currencyIntlArgs}
                minValue={0.01}
                className="text-base font-medium"
              />
              <p className="text-gray text-sm">
                <Decimal value={token.balance} /> {token.symbol}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
