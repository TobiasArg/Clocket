export type ExchangeRateCurrency = "USD" | "ARS";

export type ExchangeRateSource = "BACKEND_CONFIG" | "BACKEND_DEFAULT";

export type ExchangeRateErrorCode =
  | "INVALID_REQUEST"
  | "UNSUPPORTED_PAIR"
  | "SOURCE_UNAVAILABLE";

export interface ExchangeRateSuccessResponse {
  baseCurrency: ExchangeRateCurrency;
  quoteCurrency: ExchangeRateCurrency;
  rate: number;
  source: ExchangeRateSource;
  asOf: string;
  isStale: boolean;
  isDefault: boolean;
  isUnavailable: boolean;
  fallbackReason: string | null;
}

export interface ExchangeRateErrorResponse {
  error: string;
  code: ExchangeRateErrorCode;
  status: number;
  retryable: boolean;
}

export type ExchangeRateResponse = ExchangeRateSuccessResponse | ExchangeRateErrorResponse;

export const DEFAULT_USD_ARS_RATE = 1500;

export const SUPPORTED_EXCHANGE_RATE_PAIR = {
  baseCurrency: "USD" as const,
  quoteCurrency: "ARS" as const,
};

export const normalizeCurrency = (value: unknown): string => (
  String(value ?? "").trim().toUpperCase()
);

export const createExchangeRateErrorResponse = (options: {
  error: string;
  code: ExchangeRateErrorCode;
  status: number;
  retryable?: boolean;
}): ExchangeRateErrorResponse => ({
  error: options.error,
  code: options.code,
  status: options.status,
  retryable: options.retryable ?? false,
});
