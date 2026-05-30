import { describe, expect, it, vi } from "vitest";
import { AlphaVantageClient, AlphaVantageClientError } from "./alphaVantageClient";

const createClient = (get: ReturnType<typeof vi.fn>) => {
  return new AlphaVantageClient({
    timeoutMs: 12_000,
    httpClient: { get: get as never },
    minRequestIntervalMs: 0,
    wait: async () => undefined,
  });
};

const createAxiosError = (options: {
  message?: string;
  status?: number;
  data?: unknown;
}) => {
  const error = new Error(options.message ?? "Request failed") as Error & {
    isAxiosError: boolean;
    response?: { status: number; data?: unknown };
  };
  error.isAxiosError = true;
  if (options.status) {
    error.response = {
      status: options.status,
      data: options.data,
    };
  }
  return error;
};

describe("AlphaVantageClient", () => {
  it("maps stock quote payloads to canonical market quotes", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        "Global Quote": {
          "05. price": "210.25",
          "07. latest trading day": "2026-05-30",
          "10. change percent": "1.25%",
        },
      },
    });
    const client = createClient(get);

    await expect(client.fetchStockQuote("aapl", "demo")).resolves.toEqual({
      assetType: "stock",
      ticker: "AAPL",
      currentPrice: 210.25,
      source: "GLOBAL_QUOTE",
      dailyPctFromProvider: 1.25,
      lastRefreshed: "2026-05-30",
      timezone: null,
      bid: null,
      ask: null,
    });
    expect(get).toHaveBeenCalledWith("", {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: "AAPL",
        apikey: "demo",
      },
    });
  });

  it("maps crypto rate payloads to canonical market quotes", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        "Realtime Currency Exchange Rate": {
          "5. Exchange Rate": "70000.50",
          "6. Last Refreshed": "2026-05-30 12:00:00",
          "7. Time Zone": "UTC",
          "8. Bid Price": "69999.10",
          "9. Ask Price": "70001.90",
        },
      },
    });
    const client = createClient(get);

    await expect(client.fetchCryptoRate("btc", "demo")).resolves.toEqual({
      assetType: "crypto",
      ticker: "BTC",
      currentPrice: 70000.50,
      source: "CURRENCY_EXCHANGE_RATE",
      dailyPctFromProvider: null,
      lastRefreshed: "2026-05-30 12:00:00",
      timezone: "UTC",
      bid: 69999.10,
      ask: 70001.90,
    });
  });

  it("maps provider throttling payloads to THROTTLED errors", async () => {
    const get = vi.fn().mockResolvedValue({ data: { Note: "rate limit" } });
    const client = createClient(get);

    await expect(client.fetchStockQuote("AAPL", "demo")).rejects.toMatchObject({
      code: "THROTTLED",
      status: 429,
      retryable: false,
      details: "rate limit",
    });
  });

  it("maps provider semantic errors to INVALID_SYMBOL", async () => {
    const get = vi.fn().mockResolvedValue({ data: { "Error Message": "Invalid API call" } });
    const client = createClient(get);

    await expect(client.fetchStockQuote("NOPE", "demo")).rejects.toMatchObject({
      code: "INVALID_SYMBOL",
      status: 422,
      retryable: false,
    });
  });

  it("maps malformed stock payloads to PARSE_ERROR", async () => {
    const get = vi.fn().mockResolvedValue({ data: { "Global Quote": { "05. price": "0" } } });
    const client = createClient(get);

    await expect(client.fetchStockQuote("AAPL", "demo")).rejects.toMatchObject({
      code: "PARSE_ERROR",
      status: 502,
    });
  });

  it("retries transient provider failures before returning success", async () => {
    const get = vi.fn()
      .mockRejectedValueOnce(createAxiosError({ status: 503, data: "unavailable" }))
      .mockResolvedValueOnce({
        data: {
          "Global Quote": {
            "05. price": "210.25",
          },
        },
      });
    const client = createClient(get);

    await expect(client.fetchStockQuote("AAPL", "demo")).resolves.toMatchObject({
      currentPrice: 210.25,
    });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("returns NETWORK_ERROR when provider cannot be reached", async () => {
    const get = vi.fn().mockRejectedValue(createAxiosError({ message: "timeout" }));
    const client = new AlphaVantageClient({
      timeoutMs: 12_000,
      httpClient: { get: get as never },
      maxRetries: 0,
      minRequestIntervalMs: 0,
      wait: async () => undefined,
    });

    await expect(client.fetchStockQuote("AAPL", "demo")).rejects.toBeInstanceOf(AlphaVantageClientError);
    await expect(client.fetchStockQuote("AAPL", "demo")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 502,
      retryable: true,
    });
  });
});
