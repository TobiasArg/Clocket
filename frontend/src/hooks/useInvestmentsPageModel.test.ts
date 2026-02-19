import { describe, expect, it } from "vitest";
import { buildHistoricalSeries, computePositionMetrics } from "@/domain/investments/portfolioMetrics";
import type { InvestmentPositionItem } from "@/domain/investments/repository";
import type { AssetRefs } from "@/domain/investments/portfolioTypes";

const buildPosition = (patch: Partial<InvestmentPositionItem> = {}): InvestmentPositionItem => ({
  id: "pos_1",
  assetType: "stock",
  ticker: "AAPL",
  usd_gastado: 1000,
  buy_price: 200,
  amount: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...patch,
});

const buildRefs = (patch: Partial<AssetRefs> = {}): AssetRefs => ({
  dailyRefPrice: 205,
  dailyRefTimestamp: "2026-01-10T00:00:00.000Z",
  monthRefPrice: 180,
  monthRefTimestamp: "2026-01-01T00:00:00.000Z",
  ...patch,
});

describe("portfolio metrics", () => {
  it("computes invested/current and total pnl", () => {
    const metrics = computePositionMetrics(
      buildPosition(),
      220,
      buildRefs(),
      "2026-01-11T00:00:00.000Z",
    );

    expect(metrics.investedUSD).toBe(1000);
    expect(metrics.currentValueUSD).toBe(1100);
    expect(metrics.pnlTotalUSD).toBe(100);
    expect(metrics.pnlTotalPct).toBe(10);
    expect(metrics.pnlDailyUSD).toBe(75);
    expect(metrics.pnlMonthUSD).toBe(200);
  });

  it("returns zero percentage when reference price is 0", () => {
    const metrics = computePositionMetrics(
      buildPosition(),
      220,
      buildRefs({ dailyRefPrice: 0, monthRefPrice: 0 }),
      null,
    );

    expect(metrics.pnlDailyPct).toBe(0);
    expect(metrics.pnlMonthPct).toBe(0);
  });

  it("builds historical equity points from snapshots", () => {
    const points = buildHistoricalSeries(buildPosition(), [
      {
        id: "snap_2",
        ticker: "AAPL",
        assetType: "stock",
        timestamp: "2026-01-02T00:00:00.000Z",
        price: 190,
        source: "GLOBAL_QUOTE",
      },
      {
        id: "snap_1",
        ticker: "AAPL",
        assetType: "stock",
        timestamp: "2026-01-01T00:00:00.000Z",
        price: 180,
        source: "GLOBAL_QUOTE",
      },
    ]);

    expect(points[0].timestamp).toBe("2026-01-01T00:00:00.000Z");
    expect(points[0].equity).toBe(900);
    expect(points[1].equity).toBe(950);
  });
});
