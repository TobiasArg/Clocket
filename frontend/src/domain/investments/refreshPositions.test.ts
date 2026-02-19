import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalStorageInvestmentsPortfolioRepository } from "@/data/localStorage/investmentsPortfolioRepository";
import {
  fetchStockQuote,
  MarketQuoteApiError,
} from "@/data/http/marketQuoteApiClient";
import { refreshPositions } from "./refreshPositions";

vi.mock("@/data/http/marketQuoteApiClient", async () => {
  const actual = await vi.importActual<typeof import("@/data/http/marketQuoteApiClient")>(
    "@/data/http/marketQuoteApiClient",
  );

  return {
    ...actual,
    fetchStockQuote: vi.fn(),
    fetchCryptoRate: vi.fn(),
  };
});

describe("refreshPositions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses cached snapshot when position is within refresh threshold", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();
    const created = await repository.addPosition({
      assetType: "stock",
      ticker: "AAPL",
      usd_gastado: 1000,
      buy_price: 100,
    });

    await repository.addSnapshot({
      assetType: "stock",
      ticker: "AAPL",
      price: 110,
      source: "GLOBAL_QUOTE",
      timestamp: new Date(Date.now() - (5 * 60 * 1000)).toISOString(),
    });

    const rows = await refreshPositions([created], {
      repository,
      force: false,
    });

    expect(fetchStockQuote).not.toHaveBeenCalled();
    expect(rows[0].currentPrice).toBe(110);
  });

  it("refreshes stale snapshot, appends new snapshot and updates refs", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();
    const created = await repository.addPosition({
      assetType: "stock",
      ticker: "MSFT",
      usd_gastado: 1000,
      buy_price: 200,
      createdAt: "2025-12-01T00:00:00.000Z",
    });

    await repository.addSnapshot({
      assetType: "stock",
      ticker: "MSFT",
      price: 210,
      source: "GLOBAL_QUOTE",
      timestamp: "2025-12-31T23:59:59.000Z",
    });

    vi.mocked(fetchStockQuote).mockResolvedValue({
      assetType: "stock",
      ticker: "MSFT",
      currentPrice: 230,
      source: "GLOBAL_QUOTE",
      asOf: "2026-01-01T10:00:00.000Z",
      bid: null,
      ask: null,
      dailyPctFromProvider: 1.2,
      lastRefreshed: "2026-01-01",
      timezone: null,
    });

    const rows = await refreshPositions([created], {
      repository,
      force: false,
      now: new Date("2026-01-01T10:00:00.000Z"),
    });

    expect(fetchStockQuote).toHaveBeenCalledTimes(1);
    expect(rows[0].currentPrice).toBe(230);

    const snapshots = await repository.listSnapshotsByAsset("stock", "MSFT");
    expect(snapshots).toHaveLength(2);

    const refs = await repository.getOrInitRefs("stock", "MSFT");
    expect(refs.dailyRefPrice).toBe(230);
    expect(refs.monthRefPrice).toBe(230);
  });

  it("keeps last known price when provider request fails", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();
    const created = await repository.addPosition({
      assetType: "stock",
      ticker: "NVDA",
      usd_gastado: 500,
      buy_price: 125,
    });

    vi.mocked(fetchStockQuote).mockRejectedValue(new MarketQuoteApiError("Rate limited", {
      code: "THROTTLED",
      status: 429,
      staleWarning: "Rate limit alcanzado. Manteniendo último precio guardado.",
    }));

    const rows = await refreshPositions([created], {
      repository,
      force: true,
    });

    expect(rows[0].currentPrice).toBe(125);
    expect(rows[0].refreshError).toBe("Rate limited");
    expect(rows[0].staleWarning).toContain("Rate limit");
  });
});
