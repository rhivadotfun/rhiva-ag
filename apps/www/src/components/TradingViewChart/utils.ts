import type { ChartTimeframe, Aggregrate } from "./types";
import type {
  ResolutionString,
  Bar,
} from "../../../public/static/charting_library/charting_library";

export function mapResolutionToTimeframe(resolution: ResolutionString): {
  timeframe: ChartTimeframe;
  aggregate?: Aggregrate;
} {
  const numericResolution = parseInt(resolution, 10);
  if (resolution.includes("D")) {
    return { timeframe: "day", aggregate: "1" };
  } else if (resolution.includes("W")) {
    return { timeframe: "day", aggregate: "1" };
  } else if (resolution.includes("M")) {
    return { timeframe: "day", aggregate: "1" };
  } else if (numericResolution >= 60) {
    const hours = Math.floor(numericResolution / 60); // unsafe
    return { timeframe: "hour", aggregate: hours.toString() as Aggregrate };
  } else if (numericResolution >= 1) {
    return {
      timeframe: "minute",
      aggregate: numericResolution.toString() as Aggregrate, // unsafe
    };
  }

  return { timeframe: "minute", aggregate: "1" };
}

export function transformOHLCVToBar(ohlcv: number[]): Bar {
  const [timestamp, open, high, low, close, volume] = ohlcv;

  return {
    open,
    high,
    low,
    close,
    volume: volume || 0,
    time: timestamp * 1000,
  };
}
