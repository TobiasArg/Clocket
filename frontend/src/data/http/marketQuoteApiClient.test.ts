import { beforeEach, describe, expect, it, vi } from "vitest";

const { httpGetMock } = vi.hoisted(() => {
  return {
    httpGetMock: vi.fn(),
  };
});

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    get: httpGetMock,
  }));

  const isAxiosError = (error: unknown): boolean => {
    return typeof error === "object" && error !== null && "isAxiosError" in error;
  };

  return {
    default: {
      create,
      isAxiosError,
    },
    create,
    isAxiosError,
  };
});

import { fetchStockQuote } from "./marketQuoteApiClient";

describe("marketQuoteApiClient", () => {
  beforeEach(() => {
    httpGetMock.mockReset();
  });

  it("keeps stock bid/ask as null when provider returns null", async () => {
    httpGetMock.mockResolvedValue({
      data: {
        assetType: "stock",
        ticker: "AAPL",
        currentPrice: 264.35,
        source: "GLOBAL_QUOTE",
        asOf: "2026-02-19T16:59:20.067Z",
        bid: null,
        ask: null,
        dailyPctFromProvider: 0.1781,
        lastRefreshed: "2026-02-18",
        timezone: null,
      },
    });

    const quote = await fetchStockQuote("AAPL");

    expect(quote.bid).toBeNull();
    expect(quote.ask).toBeNull();
    expect(quote.dailyPctFromProvider).toBe(0.1781);
  });

  it("normalizes zero bid/ask to null", async () => {
    httpGetMock.mockResolvedValue({
      data: {
        assetType: "stock",
        ticker: "TSLA",
        currentPrice: 450,
        source: "GLOBAL_QUOTE",
        asOf: "2026-02-19T16:59:20.067Z",
        bid: 0,
        ask: "0",
        dailyPctFromProvider: 0,
        lastRefreshed: "2026-02-18",
        timezone: null,
      },
    });

    const quote = await fetchStockQuote("TSLA");

    expect(quote.bid).toBeNull();
    expect(quote.ask).toBeNull();
    expect(quote.dailyPctFromProvider).toBe(0);
  });
});
