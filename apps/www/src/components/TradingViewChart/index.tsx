"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type {
  ChartingLibraryWidgetOptions,
  IBasicDataFeed,
  IChartingLibraryWidget,
  ResolutionString,
} from "./types";
import { createTRPCDatafeed } from "./datafeed-trpc";
import { useTRPCClient } from "@/trpc.client";

// Re-export types and helpers for convenience
export type {
  Bar,
  DatafeedConfiguration,
  HistoryMetadata,
  IBasicDataFeed,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
} from "./types";

export { createTRPCDatafeed } from "./datafeed-trpc";

// Re-export specialized chart components
export { default as TradingViewPoolChart } from "./TradingViewPoolChart";
export { default as TradingViewTokenChart } from "./TradingViewTokenChart";
export type { TradingViewPoolChartProps } from "./TradingViewPoolChart";
export type { TradingViewTokenChartProps } from "./TradingViewTokenChart";

declare global {
  interface Window {
    TradingView?: {
      widget: new (
        options: ChartingLibraryWidgetOptions,
      ) => IChartingLibraryWidget;
      version: () => string;
    };
  }
}

export type TradingViewChartProps = {
  // Symbol configuration
  symbol?: string;
  interval?: ResolutionString;

  // tRPC Datafeed configuration (used if customDatafeed is not provided)
  address?: string;
  type?: "pool" | "token";
  network?: "solana";
  baseTokenSymbol?: string;
  quoteTokenSymbol?: string;

  // Custom datafeed (if provided, overrides tRPC datafeed)
  customDatafeed?: IBasicDataFeed;

  // Chart appearance
  theme?: "Light" | "Dark";
  autosize?: boolean;
  timezone?: string;
  locale?: string;

  // Features
  enabledFeatures?: string[];
  disabledFeatures?: string[];

  // Callbacks
  onReady?: () => void;
} & React.ComponentProps<"div">;

export default function TradingViewChart({
  symbol,
  interval = "1D",
  address,
  type = "pool",
  network = "solana",
  baseTokenSymbol,
  quoteTokenSymbol,
  customDatafeed,
  theme = "Dark",
  autosize = true,
  timezone = "Etc/UTC",
  locale = "en",
  enabledFeatures = [],
  disabledFeatures = ["use_localstorage_for_settings"],
  onReady,
  className,
  ...props
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trpcClient = useTRPCClient();

  // Derive symbol from tokens if not provided
  const chartSymbol = useMemo(() => {
    if (symbol) return symbol;
    if (baseTokenSymbol && quoteTokenSymbol) {
      return `${baseTokenSymbol}/${quoteTokenSymbol}`;
    }
    if (address) return address.slice(0, 8);
    return "CHART";
  }, [symbol, baseTokenSymbol, quoteTokenSymbol, address]);

  // Create datafeed using tRPC if custom datafeed not provided
  const datafeed = useMemo(() => {
    if (customDatafeed) return customDatafeed;
    if (!trpcClient || !address) return null;

    return createTRPCDatafeed(trpcClient, {
      type,
      address,
      network,
      baseTokenSymbol,
      quoteTokenSymbol,
    });
  }, [
    customDatafeed,
    trpcClient,
    address,
    type,
    network,
    baseTokenSymbol,
    quoteTokenSymbol,
  ]);

  // Load the TradingView library script
  useEffect(() => {
    const scriptId = "tradingview-script";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src =
      "/static/charting_library/charting_library/charting_library.js";
    script.async = true;
    script.onload = () => {
      console.log("TradingView library loaded successfully");
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load TradingView library");
      setError("Failed to load TradingView library");
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount as it may be used by other instances
    };
  }, []);

  // Initialize the widget
  useEffect(() => {
    if (!isScriptLoaded || !chartContainerRef.current || !window.TradingView) {
      return;
    }

    if (!datafeed) {
      console.warn(
        "TradingView: No datafeed available. Provide either 'address' or 'customDatafeed' prop.",
      );
      setError(
        "No datafeed configured. Provide 'address' or 'customDatafeed' prop.",
      );
      return;
    }

    const initializeWidget = async () => {
      try {
        const widgetOptions: ChartingLibraryWidgetOptions = {
          symbol: chartSymbol,
          datafeed,
          interval,
          container: chartContainerRef.current!,
          library_path: "/static/charting_library/charting_library/",
          locale,
          disabled_features: disabledFeatures,
          enabled_features: enabledFeatures,
          autosize,
          theme,
          timezone,
          loading_screen: {
            backgroundColor: theme === "Dark" ? "#131722" : "#ffffff",
            foregroundColor: theme === "Dark" ? "#2962FF" : "#000000",
          },
        };

        const tvWidget = new window.TradingView.widget(widgetOptions);
        widgetRef.current = tvWidget;

        tvWidget.onChartReady(() => {
          console.log("TradingView chart ready!");
          onReady?.();
        });
      } catch (err) {
        console.error("Error initializing TradingView widget:", err);
        setError("Failed to initialize chart widget");
      }
    };

    initializeWidget();

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [
    isScriptLoaded,
    chartSymbol,
    interval,
    datafeed,
    theme,
    autosize,
    timezone,
    locale,
    enabledFeatures,
    disabledFeatures,
    onReady,
  ]);

  if (error) {
    return (
      <div
        className={className}
        {...props}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          ...props.style,
        }}
      >
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className={className}
      {...props}
      style={{
        height: "100%",
        width: "100%",
        ...props.style,
      }}
    />
  );
}
