import { describe, expect, it } from "vitest";
import type { InvestmentPositionItem } from "@/utils";
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

describe("useInvestmentsPageModel helpers", () => {
  it("uses manual price when position source is manual", () => {
    const position = buildPosition({
      priceSource: "manual",
      manualPrice: 150,
      currentPrice: 100,
    });

    expect(resolvePositionPrice(position)).toBe(150);
  });

  it("falls back to persisted currentPrice when manual price is unavailable", () => {
    const position = buildPosition({
      priceSource: "market",
      currentPrice: 111,
    });

    expect(resolvePositionPrice(position)).toBe(111);
  });

  it("calculates invested/current/unrealized from persisted prices", () => {
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

    const summary = calculatePortfolioSummary(items, 1000);

    expect(summary.invested).toBe(250);
    expect(summary.current).toBe(270);
    expect(summary.gainAmount).toBe(20);
    expect(summary.dayGainAmount).toBe(0);
    expect(summary.currentArs).toBe(270000);
  });
});
