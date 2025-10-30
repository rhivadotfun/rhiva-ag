"use client";

import { useMemo } from "react";
import TradingViewChart, { type TradingViewChartProps } from "./index";
import { createTRPCDatafeed } from "./datafeed-trpc";
import { useTRPCClient } from "@/trpc.client";

export type TradingViewTokenChartProps = {
  tokenAddress: string;
  network?: "solana";
  baseTokenSymbol?: string;
  quoteTokenSymbol?: string;
} & Omit<TradingViewChartProps, "customDatafeed" | "symbol">;

/**
 * TradingView chart component for tokens
 * Automatically fetches OHLCV data from CoinGecko via tRPC
 */
export default function TradingViewTokenChart({
  tokenAddress,
  network = "solana",
  baseTokenSymbol,
  quoteTokenSymbol,
  ...chartProps
}: TradingViewTokenChartProps) {
  const trpcClient = useTRPCClient();

  const datafeed = useMemo(() => {
    if (!trpcClient) return null;

    return createTRPCDatafeed(trpcClient, {
      type: "token",
      address: tokenAddress,
      network,
      baseTokenSymbol,
      quoteTokenSymbol,
    });
  }, [trpcClient, tokenAddress, network, baseTokenSymbol, quoteTokenSymbol]);

  const symbol = useMemo(() => {
    if (baseTokenSymbol && quoteTokenSymbol) {
      return `${baseTokenSymbol}/${quoteTokenSymbol}`;
    }
    return tokenAddress.slice(0, 8); // Fallback to short address
  }, [baseTokenSymbol, quoteTokenSymbol, tokenAddress]);

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
