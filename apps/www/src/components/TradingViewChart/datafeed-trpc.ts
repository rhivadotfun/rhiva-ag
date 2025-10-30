import type { AppRouter } from "@rhiva-ag/trpc";
import type { TRPCClient } from "@trpc/client";
import type {
  Bar,
  DatafeedConfiguration,
  HistoryMetadata,
  IBasicDataFeed,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
} from "./types";

type Network = "solana";
type ChartTimeframe = "day" | "hour" | "minute" | "second";

interface TradingViewDatafeedConfig {
  type: "pool" | "token";
  address: string;
  network: Network;
  baseTokenSymbol?: string;
  quoteTokenSymbol?: string;
}

/**
 * Maps TradingView resolution strings to CoinGecko timeframe and aggregate values
 */
function mapResolutionToTimeframe(resolution: ResolutionString): {
  timeframe: ChartTimeframe;
  aggregate: string;
} {
  // Parse resolution - can be: 1, 5, 15, 30, 60, 1D, 1W, 1M
  const numericResolution = parseInt(resolution);

  if (resolution.includes("D")) {
    return { timeframe: "day", aggregate: "1" };
  } else if (resolution.includes("W")) {
    return { timeframe: "day", aggregate: "1" }; // Weekly - aggregate daily data
  } else if (resolution.includes("M")) {
    return { timeframe: "day", aggregate: "1" }; // Monthly - aggregate daily data
  } else if (numericResolution >= 60) {
    // Hour-based intervals
    const hours = Math.floor(numericResolution / 60);
    return { timeframe: "hour", aggregate: hours.toString() };
  } else if (numericResolution >= 1) {
    // Minute-based intervals
    return { timeframe: "minute", aggregate: numericResolution.toString() };
  }

  // Default to 1-minute
  return { timeframe: "minute", aggregate: "1" };
}

/**
 * Transform CoinGecko OHLCV data to TradingView Bar format
 * CoinGecko format: [timestamp, open, high, low, close, volume]
 */
function transformOHLCVToBar(ohlcv: number[]): Bar {
  const [timestamp, open, high, low, close, volume] = ohlcv;

  return {
    time: timestamp * 1000, // Convert to milliseconds
    open,
    high,
    low,
    close,
    volume: volume || 0,
  };
}

/**
 * Creates a TradingView datafeed using tRPC client
 */
export function createTRPCDatafeed(
  trpcClient: TRPCClient<AppRouter>,
  config: TradingViewDatafeedConfig,
): IBasicDataFeed {
  const { type, address, network, baseTokenSymbol, quoteTokenSymbol } = config;

  return {
    onReady: (callback) => {
      console.log("[tRPC Datafeed][onReady]: Method call");
      setTimeout(() => {
        const configuration: DatafeedConfiguration = {
          supports_search: false,
          supports_group_request: false,
          supported_resolutions: [
            "1",
            "5",
            "15",
            "30",
            "60",
            "240",
            "1D",
            "1W",
            "1M",
          ],
          supports_marks: false,
          supports_timescale_marks: false,
        };
        callback(configuration);
      }, 0);
    },

    searchSymbols: (userInput, exchange, symbolType, onResult) => {
      console.log("[tRPC Datafeed][searchSymbols]: Method call", {
        userInput,
        exchange,
        symbolType,
      });
      // Symbol search not implemented
      onResult([]);
    },

    resolveSymbol: async (symbolName, onResolve, onError) => {
      console.log("[tRPC Datafeed][resolveSymbol]: Method call", symbolName);

      try {
        // Fetch chart data to get token metadata
        const chartData =
          type === "pool"
            ? await trpcClient.pool.chart.query({
                pool_address: address,
                network,
                timeframe: "day",
                filter: { limit: 1 },
              })
            : await trpcClient.token.chart.query({
                token_address: address,
                network,
                timeframe: "day",
                filter: { limit: 1 },
              });

        const baseSymbol =
          baseTokenSymbol ||
          chartData.base_token?.symbol ||
          symbolName.split("/")[0] ||
          "BASE";
        const quoteSymbol =
          quoteTokenSymbol ||
          chartData.quote_token?.symbol ||
          symbolName.split("/")[1] ||
          "USD";

        const fullSymbolName = `${baseSymbol}/${quoteSymbol}`;

        const symbolInfo: LibrarySymbolInfo = {
          name: fullSymbolName,
          full_name: fullSymbolName,
          description: `${chartData.base_token?.name || baseSymbol} / ${chartData.quote_token?.name || quoteSymbol}`,
          type: "crypto",
          session: "24x7",
          timezone: "Etc/UTC",
          ticker: fullSymbolName,
          exchange: type === "pool" ? "DEX Pool" : "DEX Token",
          minmov: 1,
          pricescale: 100000000, // 8 decimals for crypto
          has_intraday: true,
          has_no_volume: false,
          has_weekly_and_monthly: true,
          supported_resolutions: [
            "1",
            "5",
            "15",
            "30",
            "60",
            "240",
            "1D",
            "1W",
            "1M",
          ],
          volume_precision: 2,
          data_status: "streaming",
        };

        onResolve(symbolInfo);
      } catch (error) {
        console.error("[tRPC Datafeed][resolveSymbol]: Error", error);
        onError(
          error instanceof Error ? error.message : "Failed to resolve symbol",
        );
      }
    },

    getBars: async (
      symbolInfo,
      resolution,
      periodParams,
      onResult,
      onError,
    ) => {
      console.log("[tRPC Datafeed][getBars]: Method call", {
        symbolInfo,
        resolution,
        periodParams,
      });

      try {
        const { timeframe, aggregate } = mapResolutionToTimeframe(resolution);
        const { from, to, firstDataRequest } = periodParams;

        // Fetch data from tRPC
        const chartData =
          type === "pool"
            ? await trpcClient.pool.chart.query({
                pool_address: address,
                network,
                timeframe,
                filter: {
                  before_timestamp: to,
                  currency: "usd",
                  limit: 1000,
                  aggregate,
                },
              })
            : await trpcClient.token.chart.query({
                token_address: address,
                network,
                timeframe,
                filter: {
                  before_timestamp: to,
                  currency: "usd",
                  limit: 1000,
                  aggregate,
                },
              });

        const ohlcvList = chartData.ohlcv_list || [];

        if (ohlcvList.length === 0) {
          onResult([], { noData: true });
          return;
        }

        // Transform to TradingView Bar format
        const bars: Bar[] = ohlcvList
          .map((ohlcv) => transformOHLCVToBar(ohlcv))
          .filter((bar) => {
            // Filter bars within the requested time range
            const barTime = bar.time / 1000; // Convert back to seconds
            return barTime >= from && barTime <= to;
          })
          .sort((a, b) => a.time - b.time); // Ensure chronological order

        console.log(`[tRPC Datafeed][getBars]: Returning ${bars.length} bars`, {
          firstBar: bars[0],
          lastBar: bars[bars.length - 1],
        });

        const meta: HistoryMetadata = {
          noData: bars.length === 0,
        };

        onResult(bars, meta);
      } catch (error) {
        console.error("[tRPC Datafeed][getBars]: Error", error);
        onError(
          error instanceof Error ? error.message : "Failed to fetch bars",
        );
      }
    },

    subscribeBars: (
      symbolInfo,
      resolution,
      onTick,
      listenerGuid,
      onResetCacheNeededCallback,
    ) => {
      console.log("[tRPC Datafeed][subscribeBars]: Method call", {
        listenerGuid,
        symbolInfo,
        resolution,
      });

      // TODO: Implement real-time updates
      // Option 1: Poll the tRPC endpoint every X seconds
      // Option 2: Use WebSocket if available
      // Option 3: Use trades endpoint to construct real-time bars

      // Example polling implementation:
      // const intervalId = setInterval(async () => {
      //   try {
      //     const { timeframe, aggregate } = mapResolutionToTimeframe(resolution);
      //     const now = Math.floor(Date.now() / 1000);
      //
      //     const chartData = type === "pool"
      //       ? await trpcClient.pool.chart.query({
      //           pool_address: address,
      //           network,
      //           timeframe,
      //           filter: {
      //             before_timestamp: now,
      //             limit: 1,
      //             aggregate,
      //           },
      //         })
      //       : await trpcClient.token.chart.query({
      //           token_address: address,
      //           network,
      //           timeframe,
      //           filter: {
      //             before_timestamp: now,
      //             limit: 1,
      //             aggregate,
      //           },
      //         });
      //
      //     const latestOHLCV = chartData.ohlcv_list?.[0];
      //     if (latestOHLCV) {
      //       const bar = transformOHLCVToBar(latestOHLCV);
      //       onTick(bar);
      //     }
      //   } catch (error) {
      //     console.error("[tRPC Datafeed][subscribeBars]: Polling error", error);
      //   }
      // }, 5000); // Poll every 5 seconds
      //
      // Store intervalId for cleanup in unsubscribeBars
    },

    unsubscribeBars: (listenerGuid) => {
      console.log(
        "[tRPC Datafeed][unsubscribeBars]: Method call",
        listenerGuid,
      );
      // TODO: Cleanup subscription (clear interval, close WebSocket, etc.)
    },
  };
}
