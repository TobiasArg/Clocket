import type {
  MarketQuote,
  MarketQuotesRepository,
  MarketQuotesResult,
  MarketUnavailableQuote,
} from "@/domain/market/quotesRepository";

const DEFAULT_ENDPOINT = "/api/market/quotes";

const normalizeSymbol = (value: string): string => value.trim().toUpperCase();

const isMarketQuote = (value: unknown): value is MarketQuote => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const quote = value as Partial<MarketQuote>;
  return (
    typeof quote.symbol === "string" &&
    typeof quote.price === "number" &&
    Number.isFinite(quote.price) &&
    (quote.previousClose === null ||
      (typeof quote.previousClose === "number" && Number.isFinite(quote.previousClose))) &&
    (quote.changePercent === null ||
      (typeof quote.changePercent === "number" && Number.isFinite(quote.changePercent))) &&
    quote.currency === "USD" &&
    quote.status === "ok" &&
    quote.source === "alpaca"
  );
};

const isUnavailableQuote = (value: unknown): value is MarketUnavailableQuote => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const unavailable = value as Partial<MarketUnavailableQuote>;
  return typeof unavailable.symbol === "string" && typeof unavailable.reason === "string";
};

const normalizeResult = (value: unknown): MarketQuotesResult => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Unexpected market quotes payload.");
  }

  const payload = value as Partial<MarketQuotesResult>;
  if (typeof payload.asOf !== "string") {
    throw new Error("Market quotes response is missing 'asOf'.");
  }

  const quotes = Array.isArray(payload.quotes) ? payload.quotes.filter(isMarketQuote) : [];
  const unavailable = Array.isArray(payload.unavailable)
    ? payload.unavailable.filter(isUnavailableQuote)
    : [];

  return {
    asOf: payload.asOf,
    feed: typeof payload.feed === "string" ? payload.feed : "iex",
    quotes,
    unavailable,
  };
};

export class AlpacaQuotesHttpRepository implements MarketQuotesRepository {
  private readonly endpoint: string;

  public constructor(endpoint: string = DEFAULT_ENDPOINT) {
    this.endpoint = endpoint;
  }

  public async getQuotes(symbols: string[]): Promise<MarketQuotesResult> {
    const normalized = Array.from(
      new Set(
        symbols
          .map(normalizeSymbol)
          .filter((symbol) => symbol.length > 0),
      ),
    );

    if (normalized.length === 0) {
      return {
        asOf: new Date().toISOString(),
        feed: "iex",
        quotes: [],
        unavailable: [],
      };
    }

    const origin = typeof window === "undefined"
      ? "http://localhost"
      : window.location.origin;
    const url = new URL(this.endpoint, origin);
    url.searchParams.set("symbols", normalized.join(","));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || "Could not load market quotes.");
    }

    const rawPayload: unknown = await response.json();
    return normalizeResult(rawPayload);
  }
}

export const marketQuotesRepository: MarketQuotesRepository =
  new AlpacaQuotesHttpRepository();
