export type MarketAssetType = "stock" | "crypto";

export type MarketQuoteSource = "GLOBAL_QUOTE" | "CURRENCY_EXCHANGE_RATE";

export type MarketQuoteStalePolicy = "KEEP_LAST_SNAPSHOT";

export type MarketQuoteErrorCode =
  | "INVALID_REQUEST"
  | "MISSING_API_KEY"
  | "THROTTLED"
  | "INVALID_SYMBOL"
  | "PARSE_ERROR"
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "RETRY_EXHAUSTED"
  | "UNKNOWN";

export interface MarketQuoteResult {
  assetType: MarketAssetType;
  ticker: string;
  currentPrice: number;
  source: MarketQuoteSource;
  asOf?: string;
  bid: number | null;
  ask: number | null;
  dailyPctFromProvider: number | null;
  lastRefreshed: string | null;
  timezone: string | null;
}

export interface MarketQuoteSuccessResponse extends MarketQuoteResult {
  asOf: string;
}

export interface MarketQuoteErrorResponse {
  error: string;
  code: MarketQuoteErrorCode;
  status: number;
  retryable: boolean;
  stalePolicy: MarketQuoteStalePolicy;
  details?: string;
}

export const MARKET_QUOTE_STALE_POLICY: MarketQuoteStalePolicy = "KEEP_LAST_SNAPSHOT";

export const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,14}$/;

export const normalizeTicker = (value: unknown): string => {
  return String(value ?? "").trim().toUpperCase();
};

export const isValidAssetType = (value: unknown): value is MarketAssetType => {
  return value === "stock" || value === "crypto";
};

export const isValidTicker = (ticker: string): boolean => {
  return TICKER_PATTERN.test(ticker);
};

export const createMarketQuoteErrorResponse = (options: {
  error: string;
  code: MarketQuoteErrorCode;
  status: number;
  retryable?: boolean;
  details?: string;
}): MarketQuoteErrorResponse => {
  return {
    error: options.error,
    code: options.code,
    status: options.status,
    retryable: options.retryable ?? false,
    stalePolicy: MARKET_QUOTE_STALE_POLICY,
    ...(options.details ? { details: options.details } : {}),
  };
};

export const withMarketQuoteAsOf = (
  quote: MarketQuoteResult,
  now: Date = new Date(),
): MarketQuoteSuccessResponse => {
  return {
    ...quote,
    asOf: quote.asOf ?? now.toISOString(),
  };
};
