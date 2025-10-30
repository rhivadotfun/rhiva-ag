// Type definitions for TradingView Charting Library
// Extend these types as needed based on your usage

export type ResolutionString = string;

export interface LibrarySymbolInfo {
  name: string;
  full_name?: string;
  description?: string;
  type: string;
  session: string;
  exchange: string;
  listed_exchange?: string;
  timezone: string;
  format?: string;
  pricescale: number;
  minmov: number;
  fractional?: boolean;
  minmove2?: number;
  has_intraday?: boolean;
  has_no_volume?: boolean;
  has_weekly_and_monthly?: boolean;
  supported_resolutions: ResolutionString[];
  intraday_multipliers?: string[];
  has_daily?: boolean;
  has_empty_bars?: boolean;
  ticker?: string;
  volume_precision?: number;
  data_status?: "streaming" | "endofday" | "pulsed" | "delayed_streaming";
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PeriodParams {
  from: number;
  to: number;
  firstDataRequest: boolean;
  countBack?: number;
}

export interface HistoryMetadata {
  noData: boolean;
  nextTime?: number;
}

export interface DatafeedConfiguration {
  supports_search?: boolean;
  supports_group_request?: boolean;
  supports_marks?: boolean;
  supports_timescale_marks?: boolean;
  supports_time?: boolean;
  supported_resolutions?: ResolutionString[];
}

export interface IBasicDataFeed {
  onReady: (callback: (configuration: DatafeedConfiguration) => void) => void;
  searchSymbols: (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: (result: any[]) => void,
  ) => void;
  resolveSymbol: (
    symbolName: string,
    onResolve: (symbolInfo: LibrarySymbolInfo) => void,
    onError: (reason: string) => void,
  ) => void;
  getBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: (bars: Bar[], meta: HistoryMetadata) => void,
    onError: (reason: string) => void,
  ) => void;
  subscribeBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: (bar: Bar) => void,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void,
  ) => void;
  unsubscribeBars: (listenerGuid: string) => void;
}

export interface ChartingLibraryWidgetOptions {
  symbol: string;
  datafeed: IBasicDataFeed;
  interval: ResolutionString;
  container: HTMLElement;
  library_path: string;
  locale?: string;
  disabled_features?: string[];
  enabled_features?: string[];
  charts_storage_url?: string;
  charts_storage_api_version?: string;
  client_id?: string;
  user_id?: string;
  fullscreen?: boolean;
  autosize?: boolean;
  theme?: "Light" | "Dark";
  timezone?: string;
  custom_css_url?: string;
  overrides?: Record<string, any>;
  studies_overrides?: Record<string, any>;
  loading_screen?: { backgroundColor?: string; foregroundColor?: string };
  favorites?: {
    intervals?: ResolutionString[];
    chartTypes?: string[];
  };
}

export interface IChartingLibraryWidget {
  onChartReady(callback: () => void): void;
  headerReady(): Promise<void>;
  onGrayedObjectClicked(callback: (subject: any) => void): void;
  onShortcut(shortcut: string, callback: () => void): void;
  subscribe(event: string, callback: (...args: any[]) => void): void;
  unsubscribe(event: string, callback: (...args: any[]) => void): void;
  chart(index?: number): any;
  setLanguage(locale: string): void;
  setSymbol(
    symbol: string,
    interval: ResolutionString,
    callback: () => void,
  ): void;
  remove(): void;
  closePopupsAndDialogs(): void;
  selectLineTool(tool: string): void;
  selectedLineTool(): string;
  save(callback: (state: any) => void): void;
  load(state: any): void;
  getSavedCharts(callback: (charts: any[]) => void): void;
  loadChartFromServer(chartRecord: any): void;
  saveChartToServer(
    onComplete?: () => void,
    onFail?: (error: any) => void,
    options?: any,
  ): void;
  removeChartFromServer(
    chartId: string,
    onComplete?: () => void,
    onFail?: (error: any) => void,
  ): void;
  onContextMenu(callback: (params: any) => void): void;
  createButton(options?: any): any;
  showNoticeDialog(params: any): void;
  showConfirmDialog(params: any): void;
  showLoadChartDialog(): void;
  showSaveAsChartDialog(): void;
  symbolInterval(): { symbol: string; interval: ResolutionString };
  mainSeriesPriceFormatter(): any;
  getIntervals(): ResolutionString[];
  getStudiesList(): string[];
  addCustomCSSFile(url: string): void;
  applyOverrides(overrides: Record<string, any>): void;
  applyStudiesOverrides(overrides: Record<string, any>): void;
  watchList(): any;
}
