"use client";

import { useMemo } from "react";
import TradingViewChart, { type TradingViewChartProps } from "./index";
import { createTRPCDatafeed } from "./datafeed-trpc";
import { useTRPCClient } from "@/trpc.client";

export type TradingViewPoolChartProps = {
  poolAddress: string;
  network?: "solana";
  baseTokenSymbol?: string;
  quoteTokenSymbol?: string;
} & Omit<TradingViewChartProps, "customDatafeed" | "symbol">;

/**
 * TradingView chart component for DEX pools
 * Automatically fetches OHLCV data from CoinGecko via tRPC
 */
export default function TradingViewPoolChart({
  poolAddress,
  network = "solana",
  baseTokenSymbol,
  quoteTokenSymbol,
  ...chartProps
}: TradingViewPoolChartProps) {
  const trpcClient = useTRPCClient();

  const datafeed = useMemo(() => {
    if (!trpcClient) return null;

    return createTRPCDatafeed(trpcClient, {
      type: "pool",
      address: poolAddress,
      network,
      baseTokenSymbol,
      quoteTokenSymbol,
    });
  }, [trpcClient, poolAddress, network, baseTokenSymbol, quoteTokenSymbol]);

  const symbol = useMemo(() => {
    if (baseTokenSymbol && quoteTokenSymbol) {
      return `${baseTokenSymbol}/${quoteTokenSymbol}`;
    }
    return poolAddress.slice(0, 8); // Fallback to short address
  }, [baseTokenSymbol, quoteTokenSymbol, poolAddress]);

  if (!datafeed) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <p>Loading chart...</p>
      </div>
    );
  }

  return (
    <TradingViewChart
      {...chartProps}
      symbol={symbol}
      customDatafeed={datafeed}
    />
  );
}
