import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshPositions } from "./refreshPositions";
import type {
  InvestmentPositionItem,
  InvestmentsRepository,
  RefreshInvestmentPositionsResult,
} from "./repository";

const position: InvestmentPositionItem = {
  id: "position-1",
  assetType: "stock",
  ticker: "AAPL",
  usd_gastado: 1000,
  buy_price: 100,
  amount: 10,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const cryptoPosition: InvestmentPositionItem = {
  id: "position-2",
  assetType: "crypto",
  ticker: "BTC",
  usd_gastado: 2000,
  buy_price: 50000,
  amount: 0.04,
  createdAt: "2026-06-02T00:00:00.000Z",
};

const refreshedResponse: RefreshInvestmentPositionsResult = {
  refreshedAt: "2026-06-12T10:00:00.000Z",
  results: [{
    positionId: position.id,
    assetType: "stock",
    ticker: "AAPL",
    currentPrice: 230,
    lastUpdatedTimestamp: "2026-06-12T10:00:00.000Z",
    status: "refreshed",
    staleWarning: null,
    refreshError: null,
    errorCode: null,
    latestSnapshot: {
      id: "snapshot-2",
      assetType: "stock",
      ticker: "AAPL",
      price: 230,
      source: "GLOBAL_QUOTE",
      timestamp: "2026-06-12T10:00:00.000Z",
    },
    refs: {
      dailyRefPrice: 210,
      dailyRefTimestamp: "2026-06-12T00:00:00.000Z",
      monthRefPrice: 200,
      monthRefTimestamp: "2026-06-01T00:00:00.000Z",
    },
    snapshots: [
      {
        id: "snapshot-1",
        assetType: "stock",
        ticker: "AAPL",
        price: 210,
        source: "GLOBAL_QUOTE",
        timestamp: "2026-06-11T10:00:00.000Z",
      },
      {
        id: "snapshot-2",
        assetType: "stock",
        ticker: "AAPL",
        price: 230,
        source: "GLOBAL_QUOTE",
        timestamp: "2026-06-12T10:00:00.000Z",
      },
    ],
  }],
};

const createRepository = (response: RefreshInvestmentPositionsResult): InvestmentsRepository => ({
  listPositions: vi.fn().mockResolvedValue([position]),
  getPositionById: vi.fn().mockResolvedValue(position),
  listEntriesByPosition: vi.fn().mockResolvedValue([]),
  listEntriesByAsset: vi.fn().mockResolvedValue([]),
  addEntry: vi.fn(),
  deleteEntry: vi.fn(),
  addPosition: vi.fn(),
  editPosition: vi.fn(),
  deletePosition: vi.fn(),
  addSnapshot: vi.fn(),
  listSnapshotsByAsset: vi.fn(),
  getLatestSnapshotByAsset: vi.fn(),
  getOrInitRefs: vi.fn(),
  updateDailyRefIfNeeded: vi.fn(),
  updateMonthRefIfNeeded: vi.fn(),
  getRefsMap: vi.fn(),
  refreshPositions: vi.fn().mockResolvedValue(response),
  clearAll: vi.fn(),
});

describe("refreshPositions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("delegates investment refresh orchestration to the backend endpoint repository", async () => {
    const repository = createRepository(refreshedResponse);

    const rows = await refreshPositions([position], { repository, force: false });

    expect(repository.refreshPositions).toHaveBeenCalledWith({
      positionIds: [position.id],
      force: false,
    });
    expect(repository.getLatestSnapshotByAsset).not.toHaveBeenCalled();
    expect(repository.addSnapshot).not.toHaveBeenCalled();
    expect(repository.updateDailyRefIfNeeded).not.toHaveBeenCalled();
    expect(rows[0]).toMatchObject({
      id: position.id,
      ticker: "AAPL",
      currentPrice: 230,
      currentValueUSD: 2300,
      pnlDailyUSD: 200,
      pnlMonthUSD: 300,
      lastUpdatedTimestamp: "2026-06-12T10:00:00.000Z",
    });
    expect(rows[0].historicalPoints).toEqual([
      expect.objectContaining({ timestamp: "2026-06-11T10:00:00.000Z", equity: 2100 }),
      expect.objectContaining({ timestamp: "2026-06-12T10:00:00.000Z", equity: 2300 }),
    ]);
  });

  it("sends force true for manual refresh", async () => {
    const repository = createRepository(refreshedResponse);

    await refreshPositions([position], { repository, force: true });

    expect(repository.refreshPositions).toHaveBeenCalledWith({
      positionIds: [position.id],
      force: true,
    });
  });

  it("maps stale fallback and cooldown responses without crashing", async () => {
    const staleResponse: RefreshInvestmentPositionsResult = {
      refreshedAt: "2026-06-12T10:00:00.000Z",
      results: [{
        ...refreshedResponse.results[0],
        currentPrice: 210,
        lastUpdatedTimestamp: "2026-06-11T10:00:00.000Z",
        status: "cooldown",
        staleWarning: "Rate limit alcanzado. Manteniendo último precio guardado.",
        refreshError: "Reintento pausado para evitar exceso de requests.",
        errorCode: "THROTTLED",
        latestSnapshot: refreshedResponse.results[0].snapshots[0],
        refs: refreshedResponse.results[0].refs,
        snapshots: [refreshedResponse.results[0].snapshots[0]],
      }],
    };
    const repository = createRepository(staleResponse);

    const rows = await refreshPositions([position], { repository });

    expect(rows[0].currentPrice).toBe(210);
    expect(rows[0].staleWarning).toContain("Rate limit");
    expect(rows[0].refreshError).toContain("Reintento pausado");
  });

  it("falls back to buy price when backend has no snapshot", async () => {
    const noSnapshotResponse: RefreshInvestmentPositionsResult = {
      refreshedAt: "2026-06-12T10:00:00.000Z",
      results: [{
        positionId: position.id,
        assetType: "stock",
        ticker: "AAPL",
        currentPrice: null,
        lastUpdatedTimestamp: null,
        status: "no_snapshot",
        staleWarning: "No se pudo actualizar. Manteniendo último precio guardado.",
        refreshError: "Provider unavailable.",
        errorCode: "NETWORK_ERROR",
        latestSnapshot: null,
        refs: null,
        snapshots: [],
      }],
    };
    const repository = createRepository(noSnapshotResponse);

    const rows = await refreshPositions([position], { repository });

    expect(rows[0].currentPrice).toBe(position.buy_price);
    expect(rows[0].historicalPoints).toEqual([]);
    expect(rows[0].staleWarning).toContain("No se pudo actualizar");
  });

  it("batches multiple visible positions into one backend refresh request", async () => {
    const response: RefreshInvestmentPositionsResult = {
      refreshedAt: "2026-06-12T10:00:00.000Z",
      results: [
        refreshedResponse.results[0],
        {
          positionId: cryptoPosition.id,
          assetType: "crypto",
          ticker: "BTC",
          currentPrice: 70000,
          lastUpdatedTimestamp: "2026-06-12T10:00:00.000Z",
          status: "refreshed",
          staleWarning: null,
          refreshError: null,
          errorCode: null,
          latestSnapshot: {
            id: "btc-snapshot-1",
            assetType: "crypto",
            ticker: "BTC",
            price: 70000,
            source: "CURRENCY_EXCHANGE_RATE",
            timestamp: "2026-06-12T10:00:00.000Z",
          },
          refs: {
            dailyRefPrice: 69000,
            dailyRefTimestamp: "2026-06-12T00:00:00.000Z",
            monthRefPrice: 65000,
            monthRefTimestamp: "2026-06-01T00:00:00.000Z",
          },
          snapshots: [],
        },
      ],
    };
    const repository = createRepository(response);

    const rows = await refreshPositions([position, cryptoPosition], { repository });

    expect(repository.refreshPositions).toHaveBeenCalledTimes(1);
    expect(repository.refreshPositions).toHaveBeenCalledWith({
      positionIds: [position.id, cryptoPosition.id],
      force: false,
    });
    expect(rows).toHaveLength(2);
    expect(rows[1].currentPrice).toBe(70000);
  });
});
