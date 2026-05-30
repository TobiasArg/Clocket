import axios, { type AxiosInstance } from "axios";
import type {
  MarketQuoteErrorCode,
  MarketQuoteResult,
} from "../../modules/market/marketQuoteContracts";
import { normalizeTicker } from "../../modules/market/marketQuoteContracts";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 1_100;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

type AlphaVantagePayload = Record<string, unknown>;

interface HttpClient {
  get: AxiosInstance["get"];
}

export interface AlphaVantageClientOptions {
  timeoutMs: number;
  httpClient?: HttpClient;
  maxRetries?: number;
  minRequestIntervalMs?: number;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
}

export interface MarketQuoteProvider {
  fetchStockQuote: (ticker: string, apiKey: string) => Promise<MarketQuoteResult>;
  fetchCryptoRate: (ticker: string, apiKey: string) => Promise<MarketQuoteResult>;
}

export class AlphaVantageClientError extends Error {
  public readonly code: MarketQuoteErrorCode;

  public readonly status: number;

  public readonly retryable: boolean;

  public readonly details?: string;

  public constructor(
    message: string,
    options: {
      code?: MarketQuoteErrorCode;
      status?: number;
      retryable?: boolean;
      details?: string;
    } = {},
  ) {
    super(message);
    this.name = "AlphaVantageClientError";
    this.code = options.code ?? "UNKNOWN";
    this.status = options.status ?? 502;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

const defaultWait = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const parsePositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseOptionalFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalPositiveNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizePercent = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = value.replace("%", "").trim();
  return parseOptionalFiniteNumber(sanitized);
};

const isObjectPayload = (value: unknown): value is AlphaVantagePayload => {
  return typeof value === "object" && value !== null;
};

const isTransientAxiosError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return RETRYABLE_STATUSES.has(error.response.status);
};

const toErrorDetails = (data: unknown): string => {
  if (typeof data === "string") {
    return data.slice(0, 240);
  }

  if (typeof data === "object" && data !== null) {
    try {
      return JSON.stringify(data).slice(0, 240);
    } catch {
      return "Provider payload could not be serialized.";
    }
  }

  return "No details available.";
};

const readString = (payload: AlphaVantagePayload, key: string): string | null => {
  const value = payload[key];
  return typeof value === "string" ? value : null;
};

export class AlphaVantageClient implements MarketQuoteProvider {
  private readonly httpClient: HttpClient;

  private readonly maxRetries: number;

  private readonly minRequestIntervalMs: number;

  private readonly wait: (ms: number) => Promise<void>;

  private readonly now: () => number;

  private lastProviderRequestAt = 0;

  private providerQueue: Promise<void> = Promise.resolve();

  public constructor(options: AlphaVantageClientOptions) {
    this.httpClient = options.httpClient ?? axios.create({
      baseURL: ALPHA_VANTAGE_BASE_URL,
      timeout: options.timeoutMs,
    });
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.minRequestIntervalMs = options.minRequestIntervalMs ?? DEFAULT_MIN_REQUEST_INTERVAL_MS;
    this.wait = options.wait ?? defaultWait;
    this.now = options.now ?? Date.now;
  }

  public async fetchStockQuote(ticker: string, apiKey: string): Promise<MarketQuoteResult> {
    const normalizedTicker = normalizeTicker(ticker);
    const payload = await this.requestAlphaVantage({
      function: "GLOBAL_QUOTE",
      symbol: normalizedTicker,
      apikey: apiKey,
    });

    const quote = payload["Global Quote"];
    if (!isObjectPayload(quote)) {
      throw new AlphaVantageClientError("Global Quote payload is missing.", {
        code: "PARSE_ERROR",
        status: 502,
      });
    }

    const currentPrice = parsePositiveNumber(quote["05. price"]);
    if (currentPrice === null) {
      const hasAnyField = Object.keys(quote).length > 0;
      throw new AlphaVantageClientError("Global Quote price is invalid.", {
        code: hasAnyField ? "PARSE_ERROR" : "INVALID_SYMBOL",
        status: hasAnyField ? 502 : 422,
        details: toErrorDetails(quote),
      });
    }

    return {
      assetType: "stock",
      ticker: normalizedTicker,
      currentPrice,
      source: "GLOBAL_QUOTE",
      dailyPctFromProvider: normalizePercent(quote["10. change percent"]),
      lastRefreshed: readString(quote, "07. latest trading day"),
      timezone: null,
      bid: null,
      ask: null,
    };
  }

  public async fetchCryptoRate(ticker: string, apiKey: string): Promise<MarketQuoteResult> {
    const normalizedTicker = normalizeTicker(ticker);
    const payload = await this.requestAlphaVantage({
      function: "CURRENCY_EXCHANGE_RATE",
      from_currency: normalizedTicker,
      to_currency: "USD",
      apikey: apiKey,
    });

    const rate = payload["Realtime Currency Exchange Rate"];
    if (!isObjectPayload(rate)) {
      throw new AlphaVantageClientError("Exchange rate payload is missing or symbol is invalid.", {
        code: "INVALID_SYMBOL",
        status: 422,
      });
    }

    const currentPrice = parsePositiveNumber(rate["5. Exchange Rate"]);
    if (currentPrice === null) {
      const hasAnyField = Object.keys(rate).length > 0;
      throw new AlphaVantageClientError("Exchange rate price is invalid.", {
        code: hasAnyField ? "PARSE_ERROR" : "INVALID_SYMBOL",
        status: hasAnyField ? 502 : 422,
        details: toErrorDetails(rate),
      });
    }

    return {
      assetType: "crypto",
      ticker: normalizedTicker,
      currentPrice,
      source: "CURRENCY_EXCHANGE_RATE",
      dailyPctFromProvider: null,
      lastRefreshed: readString(rate, "6. Last Refreshed"),
      timezone: readString(rate, "7. Time Zone"),
      bid: parseOptionalPositiveNumber(rate["8. Bid Price"]),
      ask: parseOptionalPositiveNumber(rate["9. Ask Price"]),
    };
  }

  private async scheduleProviderRequest<T>(execute: () => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      const elapsed = this.now() - this.lastProviderRequestAt;
      if (elapsed < this.minRequestIntervalMs) {
        await this.wait(this.minRequestIntervalMs - elapsed);
      }

      this.lastProviderRequestAt = this.now();
      return execute();
    };

    const pending = this.providerQueue.then(run, run);
    this.providerQueue = pending.then(
      () => undefined,
      () => undefined,
    );

    return pending;
  }

  private async requestAlphaVantage(params: Record<string, string>): Promise<AlphaVantagePayload> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const response = await this.scheduleProviderRequest(() => {
          return this.httpClient.get("", { params });
        });
        const payload = response.data;

        if (isObjectPayload(payload)) {
          const information = readString(payload, "Information");
          if (information && information.trim().length > 0) {
            throw new AlphaVantageClientError("Alpha Vantage rate limit exceeded.", {
              code: "THROTTLED",
              status: 429,
              retryable: false,
              details: information,
            });
          }

          const note = readString(payload, "Note");
          if (note && note.trim().length > 0) {
            throw new AlphaVantageClientError("Alpha Vantage rate limit exceeded.", {
              code: "THROTTLED",
              status: 429,
              retryable: false,
              details: note,
            });
          }

          const errorMessage = readString(payload, "Error Message");
          if (errorMessage && errorMessage.trim().length > 0) {
            throw new AlphaVantageClientError("Alpha Vantage rejected the request.", {
              code: "INVALID_SYMBOL",
              status: 422,
              retryable: false,
              details: errorMessage,
            });
          }

          return payload;
        }

        return {};
      } catch (error) {
        if (error instanceof AlphaVantageClientError) {
          throw error;
        }

        const canRetry = attempt < this.maxRetries && isTransientAxiosError(error);
        if (canRetry) {
          await this.wait(300 * (attempt + 1));
          attempt += 1;
          continue;
        }

        if (axios.isAxiosError(error)) {
          throw new AlphaVantageClientError("Alpha Vantage request failed.", {
            code: error.response ? "HTTP_ERROR" : "NETWORK_ERROR",
            status: error.response?.status ?? 502,
            retryable: isTransientAxiosError(error),
            details: toErrorDetails(error.response?.data ?? error.message),
          });
        }

        throw new AlphaVantageClientError("Unknown Alpha Vantage client error.", {
          code: "UNKNOWN",
          status: 502,
        });
      }
    }

    throw new AlphaVantageClientError("Retry budget exceeded for Alpha Vantage request.", {
      code: "RETRY_EXHAUSTED",
      status: 502,
    });
  }
}

export const createAlphaVantageClient = (
  options: AlphaVantageClientOptions,
): AlphaVantageClient => {
  return new AlphaVantageClient(options);
};
