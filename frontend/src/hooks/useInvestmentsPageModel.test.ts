import { describe, expect, it } from "vitest";
import type { InvestmentPositionItem, MarketQuote } from "@/utils";
import {
  calculatePortfolioSummary,
  resolvePositionPrice,
} from "./useInvestmentsPageModel";

const buildPosition = (patch: Partial<InvestmentPositionItem>): InvestmentPositionItem => ({
  id: "inv_1",
  ticker: "AAPL",
  name: "Apple",
  exchange: "NASDAQ",
  shares: 2,
  costBasis: 100,
  currentPrice: 110,
  priceSource: "market",
  manualPrice: undefined,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...patch,
});

const buildQuote = (patch: Partial<MarketQuote>): MarketQuote => ({
  symbol: "AAPL",
  price: 120,
  previousClose: 118,
  changePercent: 1.69,
  currency: "USD",
  status: "ok",
  source: "alpaca",
  ...patch,
});

describe("useInvestmentsPageModel helpers", () => {
  it("uses manual price when position source is manual", () => {
    const position = buildPosition({
      priceSource: "manual",
      manualPrice: 150,
      currentPrice: 100,
    });
    const quote = buildQuote({ price: 190 });

    expect(resolvePositionPrice(position, quote)).toBe(150);
  });

  it("falls back to persisted currentPrice when market quote is unavailable", () => {
    const position = buildPosition({
      priceSource: "market",
      currentPrice: 111,
    });

    expect(resolvePositionPrice(position, undefined)).toBe(111);
  });

  it("calculates invested/current/unrealized and day change from market quotes", () => {
    const items = [
      buildPosition({
        id: "inv_market",
        ticker: "AAPL",
        shares: 2,
        costBasis: 100,
        currentPrice: 105,
        priceSource: "market",
      }),
      buildPosition({
        id: "inv_manual",
        ticker: "MSFT",
        shares: 1,
        costBasis: 50,
        currentPrice: 52,
        priceSource: "manual",
        manualPrice: 60,
      }),
    ];

    const quoteBySymbol = new Map<string, MarketQuote>([
      ["AAPL", buildQuote({ symbol: "AAPL", price: 120, previousClose: 118 })],
      ["MSFT", buildQuote({ symbol: "MSFT", price: 130, previousClose: 129 })],
    ]);

    const summary = calculatePortfolioSummary(items, quoteBySymbol, 1000);

    expect(summary.invested).toBe(250);
    expect(summary.current).toBe(300);
    expect(summary.gainAmount).toBe(50);
    expect(summary.dayGainAmount).toBe(4);
    expect(summary.currentArs).toBe(300000);
  });
});
