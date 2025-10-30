import type { ResolutionString } from "../../../public/static/charting_library/charting_library";

export type Network = "solana";
export type Aggregrate = "1" | "4" | "12" | "15" | "30";
export type ChartTimeframe = "day" | "hour" | "minute" | "second";

export type Token = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url: string;
};

export type TradingViewDatafeedConfig = {
  network: Network;
  supportedResolutions: ResolutionString[];
};

export type SearchResultItem = {
  address?: string;
  quote_token?: Token;
  base_token: Token;
  dex?: { id: string; type?: string };
};
