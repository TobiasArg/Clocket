import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlphaVantageClientError, type MarketQuoteProvider } from "../../providers/alpha-vantage/alphaVantageClient";
import { createMarketQuoteHandler } from "./marketQuoteHandler";
import type { MarketQuoteErrorResponse, MarketQuoteSuccessResponse } from "./marketQuoteContracts";

type JsonPayload = MarketQuoteSuccessResponse | MarketQuoteErrorResponse;

const createMockResponse = () => {
  const response = {
    headers: new Map<string, string>(),
    statusCode: 0,
    payload: undefined as JsonPayload | undefined,
    setHeader: vi.fn((name: string, value: string) => {
      response.headers.set(name, value);
    }),
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((payload: JsonPayload) => {
      response.payload = payload;
      return response;
    }),
  };

  return response as unknown as NextApiResponse<JsonPayload> & typeof response;
};

const createRequest = (overrides: Partial<NextApiRequest>): NextApiRequest => {
  return {
    method: "GET",
    query: {},
    ...overrides,
  } as NextApiRequest;
};

const createProvider = (): MarketQuoteProvider => ({
  fetchStockQuote: vi.fn().mockResolvedValue({
    assetType: "stock",
    ticker: "AAPL",
    currentPrice: 200,
    source: "GLOBAL_QUOTE",
    dailyPctFromProvider: 1.5,
    lastRefreshed: "2026-05-30",
    timezone: null,
    bid: null,
    ask: null,
  }),
  fetchCryptoRate: vi.fn().mockResolvedValue({
    assetType: "crypto",
    ticker: "BTC",
    currentPrice: 70_000,
    source: "CURRENCY_EXCHANGE_RATE",
    dailyPctFromProvider: null,
    lastRefreshed: "2026-05-30 12:00:00",
    timezone: "UTC",
    bid: 69_990,
    ask: 70_010,
  }),
});

describe("createMarketQuoteHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 and Allow header for unsupported methods", async () => {
    const response = createMockResponse();
    const handler = createMarketQuoteHandler({ env: { ALPHA_VANTAGE_API_KEY: "demo" } });

    await handler(createRequest({ method: "POST" }), response);

    expect(response.statusCode).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    expect(response.payload).toMatchObject({
      code: "INVALID_REQUEST",
      status: 405,
      stalePolicy: "KEEP_LAST_SNAPSHOT",
    });
  });

  it("returns 400 for invalid asset type", async () => {
    const response = createMockResponse();
    const handler = createMarketQuoteHandler({ env: { ALPHA_VANTAGE_API_KEY: "demo" } });

    await handler(createRequest({ query: { assetType: "bond", ticker: "AAPL" } }), response);

    expect(response.statusCode).toBe(400);
    expect(response.payload).toMatchObject({
      code: "INVALID_REQUEST",
      status: 400,
      retryable: false,
    });
  });

  it("returns 400 for invalid ticker", async () => {
    const response = createMockResponse();
    const handler = createMarketQuoteHandler({ env: { ALPHA_VANTAGE_API_KEY: "demo" } });

    await handler(createRequest({ query: { assetType: "stock", ticker: "***" } }), response);

    expect(response.statusCode).toBe(400);
    expect(response.payload).toMatchObject({
      code: "INVALID_REQUEST",
      status: 400,
    });
  });

  it("returns 500 when the provider API key is missing", async () => {
    const response = createMockResponse();
    const provider = createProvider();
    const handler = createMarketQuoteHandler({ env: {}, alphaVantageClient: provider });

    await handler(createRequest({ query: { assetType: "stock", ticker: "AAPL" } }), response);

    expect(response.statusCode).toBe(500);
    expect(response.payload).toMatchObject({
      code: "MISSING_API_KEY",
      status: 500,
      retryable: false,
    });
    expect(provider.fetchStockQuote).not.toHaveBeenCalled();
  });

  it("returns normalized stock quote response", async () => {
    const response = createMockResponse();
    const provider = createProvider();
    const handler = createMarketQuoteHandler({
      env: { ALPHA_VANTAGE_API_KEY: "demo" },
      alphaVantageClient: provider,
      now: () => new Date("2026-05-30T10:00:00.000Z"),
    });

    await handler(createRequest({ query: { assetType: "stock", ticker: "aapl" } }), response);

    expect(provider.fetchStockQuote).toHaveBeenCalledWith("AAPL", "demo");
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      assetType: "stock",
      ticker: "AAPL",
      currentPrice: 200,
      source: "GLOBAL_QUOTE",
      dailyPctFromProvider: 1.5,
      lastRefreshed: "2026-05-30",
      timezone: null,
      bid: null,
      ask: null,
      asOf: "2026-05-30T10:00:00.000Z",
    });
  });

  it("returns canonical provider errors", async () => {
    const response = createMockResponse();
    const provider = createProvider();
    vi.mocked(provider.fetchCryptoRate).mockRejectedValue(new AlphaVantageClientError(
      "Alpha Vantage rate limit exceeded.",
      {
        code: "THROTTLED",
        status: 429,
        retryable: false,
        details: "free tier limit",
      },
    ));
    const handler = createMarketQuoteHandler({
      env: { ALPHA_VANTAGE_API_KEY: "demo" },
      alphaVantageClient: provider,
    });

    await handler(createRequest({ query: { assetType: "crypto", ticker: "btc" } }), response);

    expect(provider.fetchCryptoRate).toHaveBeenCalledWith("BTC", "demo");
    expect(response.statusCode).toBe(429);
    expect(response.payload).toEqual({
      error: "Alpha Vantage rate limit exceeded.",
      code: "THROTTLED",
      status: 429,
      retryable: false,
      stalePolicy: "KEEP_LAST_SNAPSHOT",
      details: "free tier limit",
    });
  });
});
