import axios from "axios";
import type { AssetType, SnapshotSource } from "@/domain/investments/portfolioTypes";

const QUOTE_ENDPOINT = "/api/market/quote";

const quoteHttpClient = axios.create({
  timeout: 12_000,
  headers: {
    Accept: "application/json",
  },
});

export interface MarketQuoteApiResult {
  assetType: AssetType;
  ticker: string;
  currentPrice: number;
  source: SnapshotSource;
  asOf: string;
  bid: number | null;
  ask: number | null;
  dailyPctFromProvider: number | null;
  lastRefreshed: string | null;
  timezone: string | null;
}

export interface MarketQuoteApiErrorDetails {
  code: string;
  status: number;
  staleWarning: string;
}

export class MarketQuoteApiError extends Error {
  public readonly code: string;

  public readonly status: number;

  public readonly staleWarning: string;

  public constructor(message: string, details: MarketQuoteApiErrorDetails) {
    super(message);
    this.name = "MarketQuoteApiError";
    this.code = details.code;
    this.status = details.status;
    this.staleWarning = details.staleWarning;
  }
}

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

const normalizeTicker = (value: unknown): string => String(value ?? "").trim().toUpperCase();

const normalizeQuotePayload = (value: unknown): MarketQuoteApiResult => {
  if (typeof value !== "object" || value === null) {
    throw new MarketQuoteApiError("Unexpected quote payload.", {
      code: "INVALID_PAYLOAD",
      status: 502,
      staleWarning: "Payload inválido del proveedor. Usando último precio guardado.",
    });
  }

  const payload = value as Partial<MarketQuoteApiResult>;
  const assetType = payload.assetType === "crypto" ? "crypto" : "stock";
  const ticker = normalizeTicker(payload.ticker);
  const source: SnapshotSource = payload.source === "CURRENCY_EXCHANGE_RATE"
    ? "CURRENCY_EXCHANGE_RATE"
    : "GLOBAL_QUOTE";
  const currentPrice = parsePositiveNumber(payload.currentPrice);

  if (!ticker || currentPrice === null) {
    throw new MarketQuoteApiError("Quote response is missing required fields.", {
      code: "INVALID_PAYLOAD",
      status: 502,
      staleWarning: "Cotización inválida del proveedor. Usando último precio guardado.",
    });
  }

  return {
    assetType,
    ticker,
    currentPrice,
    source,
    asOf: typeof payload.asOf === "string" ? payload.asOf : new Date().toISOString(),
    bid: parseOptionalPositiveNumber(payload.bid),
    ask: parseOptionalPositiveNumber(payload.ask),
    dailyPctFromProvider: parseOptionalFiniteNumber(payload.dailyPctFromProvider),
    lastRefreshed: typeof payload.lastRefreshed === "string" ? payload.lastRefreshed : null,
    timezone: typeof payload.timezone === "string" ? payload.timezone : null,
  };
};

const toMarketError = (error: unknown): MarketQuoteApiError => {
  if (error instanceof MarketQuoteApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 502;
    const responseData = error.response?.data;

    const responseError = (
      typeof responseData === "object" &&
      responseData !== null &&
      typeof (responseData as { error?: unknown }).error === "string"
    )
      ? (responseData as { error: string }).error
      : null;

    const responseCode = (
      typeof responseData === "object" &&
      responseData !== null &&
      typeof (responseData as { code?: unknown }).code === "string"
    )
      ? (responseData as { code: string }).code
      : null;

    if (responseCode === "THROTTLED" || status === 429) {
      return new MarketQuoteApiError(responseError ?? "Rate limited by provider.", {
        code: "THROTTLED",
        status,
        staleWarning: "Rate limit alcanzado. Manteniendo último precio guardado.",
      });
    }

    if (responseCode === "INVALID_SYMBOL" || status === 422) {
      return new MarketQuoteApiError(responseError ?? "Invalid ticker.", {
        code: "INVALID_SYMBOL",
        status,
        staleWarning: "Ticker inválido. Manteniendo último precio guardado.",
      });
    }

    return new MarketQuoteApiError(responseError ?? "Quote request failed.", {
      code: responseCode ?? (error.response ? "HTTP_ERROR" : "NETWORK_ERROR"),
      status,
      staleWarning: "No se pudo actualizar la cotización. Manteniendo último precio guardado.",
    });
  }

  return new MarketQuoteApiError("Unknown market quote error.", {
    code: "UNKNOWN",
    status: 502,
    staleWarning: "Error inesperado. Manteniendo último precio guardado.",
  });
};

const fetchQuote = async (
  ticker: string,
  assetType: AssetType,
): Promise<MarketQuoteApiResult> => {
  try {
    const response = await quoteHttpClient.get(QUOTE_ENDPOINT, {
      params: {
        ticker: normalizeTicker(ticker),
        assetType,
      },
    });

    return normalizeQuotePayload(response.data);
  } catch (error) {
    throw toMarketError(error);
  }
};

export const fetchStockQuote = async (ticker: string): Promise<MarketQuoteApiResult> => {
  return fetchQuote(ticker, "stock");
};

export const fetchCryptoRate = async (ticker: string): Promise<MarketQuoteApiResult> => {
  return fetchQuote(ticker, "crypto");
};
