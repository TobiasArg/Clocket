import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { AlphaVantageClientError, type MarketQuoteProvider } from "../../providers/alpha-vantage/alphaVantageClient";
import { createInvestmentPositionsRefreshHandler } from "./investmentsApiHandler";
import { createInvestmentMarketRefreshService, type FailureCooldownEntry } from "./investmentMarketRefreshService";
import type { InvestmentsRepository } from "./investmentsRepository";

const position = {
  id: "position-1",
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  displayName: null,
  usd_gastado: "1000.00",
  buy_price: "100.0000000000",
  amount: "10.0000000000",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
};

const duplicatePosition = {
  ...position,
  id: "position-2",
};

const snapshot = {
  id: "snapshot-1",
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  timestamp: "2026-06-12T09:00:00.000Z",
  price: "210.0000000000",
  source: "GLOBAL_QUOTE" as const,
  bid: null,
  ask: null,
  providerAsOf: "2026-06-12T09:00:00.000Z",
  fetchedAt: "2026-06-12T09:00:00.000Z",
};

const refreshedSnapshot = {
  ...snapshot,
  id: "snapshot-2",
  timestamp: "2026-06-12T10:00:00.000Z",
  price: "230.0000000000",
  providerAsOf: "2026-06-12T10:00:00.000Z",
  fetchedAt: "2026-06-12T10:00:00.000Z",
};

const refs = {
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  dailyRefPrice: "230.0000000000",
  dailyRefTimestamp: "2026-06-12T10:00:00.000Z",
  monthRefPrice: "230.0000000000",
  monthRefTimestamp: "2026-06-12T10:00:00.000Z",
  updatedAt: "2026-06-12T10:00:00.000Z",
};

const entry = {
  id: "entry-1",
  positionId: position.id,
  assetId: position.assetId,
  assetType: "stock" as const,
  ticker: "AAPL",
  entryType: "ingreso" as const,
  usd_gastado: "1000.00",
  buy_price: "100.0000000000",
  amount: "10.0000000000",
  transactionId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const createRepository = (): InvestmentsRepository => ({
  listPositions: vi.fn().mockResolvedValue([position]),
  getPositionById: vi.fn().mockImplementation((id: string) => {
    if (id === position.id) return Promise.resolve(position);
    if (id === duplicatePosition.id) return Promise.resolve(duplicatePosition);
    return Promise.resolve(null);
  }),
  addPosition: vi.fn().mockResolvedValue(position),
  editPosition: vi.fn().mockResolvedValue(position),
  deletePosition: vi.fn().mockResolvedValue(true),
  listEntriesByPosition: vi.fn().mockResolvedValue([]),
  listEntriesByAsset: vi.fn().mockResolvedValue([]),
  addEntry: vi.fn().mockResolvedValue({ position, entry }),
  deleteEntry: vi.fn().mockResolvedValue(true),
  addSnapshot: vi.fn().mockResolvedValue(refreshedSnapshot),
  listSnapshotsByAsset: vi.fn().mockResolvedValue([snapshot, refreshedSnapshot]),
  getLatestSnapshotByAsset: vi.fn().mockResolvedValue(null),
  getOrInitRefs: vi.fn().mockResolvedValue(refs),
  getRefsByAsset: vi.fn().mockResolvedValue(refs),
  updateDailyRefIfNeeded: vi.fn().mockResolvedValue(refs),
  updateMonthRefIfNeeded: vi.fn().mockResolvedValue(refs),
  getRefsMap: vi.fn().mockResolvedValue({ "stock:AAPL": refs }),
  clearAll: vi.fn().mockResolvedValue(undefined),
});

const createProvider = (): MarketQuoteProvider => ({
  fetchStockQuote: vi.fn().mockResolvedValue({
    assetType: "stock",
    ticker: "AAPL",
    currentPrice: 230,
    source: "GLOBAL_QUOTE",
    dailyPctFromProvider: null,
    lastRefreshed: "2026-06-12",
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
    lastRefreshed: "2026-06-12 10:00:00",
    timezone: "UTC",
    bid: 69_990,
    ask: 70_010,
  }),
});

describe("investment market refresh service", () => {
  it("skips provider calls for same-day snapshots when not forced", async () => {
    const repository = createRepository();
    vi.mocked(repository.getLatestSnapshotByAsset).mockResolvedValue(snapshot);
    vi.mocked(repository.listSnapshotsByAsset).mockResolvedValue([snapshot]);
    const provider = createProvider();
    const service = createInvestmentMarketRefreshService({
      repository,
      alphaVantageClient: provider,
      env: { ALPHA_VANTAGE_API_KEY: "demo" },
      now: () => new Date("2026-06-12T10:00:00.000Z"),
      failureCooldownCache: new Map(),
    });

    const response = await service.refreshPositions({ positionIds: [position.id], force: false });

    expect(provider.fetchStockQuote).not.toHaveBeenCalled();
    expect(response.results[0]).toMatchObject({
      positionId: position.id,
      status: "skipped_fresh",
      currentPrice: snapshot.price,
      latestSnapshot: snapshot,
      refs,
    });
  });

  it("forces provider refresh, persists snapshot, and updates refs", async () => {
    const repository = createRepository();
    vi.mocked(repository.getLatestSnapshotByAsset).mockResolvedValue(snapshot);
    const provider = createProvider();
    const service = createInvestmentMarketRefreshService({
      repository,
      alphaVantageClient: provider,
      env: { ALPHA_VANTAGE_API_KEY: "demo" },
      now: () => new Date("2026-06-12T10:00:00.000Z"),
      failureCooldownCache: new Map(),
    });

    const response = await service.refreshPositions({ positionIds: [position.id], force: true });

    expect(provider.fetchStockQuote).toHaveBeenCalledWith("AAPL", "demo");
    expect(repository.addSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      assetType: "stock",
      ticker: "AAPL",
      price: 230,
      source: "GLOBAL_QUOTE",
      timestamp: "2026-06-12T10:00:00.000Z",
      fetchedAt: "2026-06-12T10:00:00.000Z",
    }));
    expect(repository.updateDailyRefIfNeeded).toHaveBeenCalledWith("stock", "AAPL", 230, "2026-06-12T10:00:00.000Z");
    expect(repository.updateMonthRefIfNeeded).toHaveBeenCalledWith("stock", "AAPL", 230, "2026-06-12T10:00:00.000Z");
    expect(response.results[0]).toMatchObject({ status: "refreshed", currentPrice: "230.0000000000", refs });
  });

  it("deduplicates repeated normalized assets within one request", async () => {
    const repository = createRepository();
    const provider = createProvider();
    const service = createInvestmentMarketRefreshService({
      repository,
      alphaVantageClient: provider,
      env: { ALPHA_VANTAGE_API_KEY: "demo" },
      now: () => new Date("2026-06-12T10:00:00.000Z"),
      failureCooldownCache: new Map(),
    });

    const response = await service.refreshPositions({
      positionIds: [position.id, duplicatePosition.id],
      assets: [{ assetType: "stock", ticker: "aapl" }],
      force: true,
    });

    expect(provider.fetchStockQuote).toHaveBeenCalledTimes(1);
    expect(repository.addSnapshot).toHaveBeenCalledTimes(1);
    expect(response.results).toHaveLength(3);
    expect(response.results.map((result) => result.positionId)).toEqual([position.id, duplicatePosition.id, null]);
  });

  it.each([
    ["THROTTLED" as const, "Rate limit alcanzado"],
    ["INVALID_SYMBOL" as const, "Ticker inválido"],
    ["NETWORK_ERROR" as const, "No se pudo actualizar"],
    ["PARSE_ERROR" as const, "No se pudo actualizar"],
  ])("returns stale fallback for %s failures without persisting invalid snapshots", async (code, warning) => {
    const repository = createRepository();
    vi.mocked(repository.getLatestSnapshotByAsset).mockResolvedValue(snapshot);
    vi.mocked(repository.listSnapshotsByAsset).mockResolvedValue([snapshot]);
    const provider = createProvider();
    vi.mocked(provider.fetchStockQuote).mockRejectedValue(new AlphaVantageClientError("Provider failed.", { code, status: code === "INVALID_SYMBOL" ? 422 : 502 }));
    const service = createInvestmentMarketRefreshService({
      repository,
      alphaVantageClient: provider,
      env: { ALPHA_VANTAGE_API_KEY: "demo" },
      now: () => new Date("2026-06-13T10:00:00.000Z"),
      failureCooldownCache: new Map(),
    });

    const response = await service.refreshPositions({ positionIds: [position.id] });

    expect(repository.addSnapshot).not.toHaveBeenCalled();
    expect(response.results[0]).toMatchObject({
      status: "stale_fallback",
      errorCode: code,
      refreshError: "Provider failed.",
      currentPrice: snapshot.price,
    });
    expect(response.results[0].staleWarning).toContain(warning);
  });

  it("returns no_snapshot when provider fails without a persisted fallback", async () => {
    const repository = createRepository();
    vi.mocked(repository.getLatestSnapshotByAsset).mockResolvedValue(null);
    vi.mocked(repository.listSnapshotsByAsset).mockResolvedValue([]);
    const provider = createProvider();
    vi.mocked(provider.fetchStockQuote).mockRejectedValue(new Error("Unexpected provider failure."));
    const service = createInvestmentMarketRefreshService({
      repository,
      alphaVantageClient: provider,
      env: { ALPHA_VANTAGE_API_KEY: "demo" },
      now: () => new Date("2026-06-13T10:00:00.000Z"),
      failureCooldownCache: new Map(),
    });

    const response = await service.refreshPositions({ positionIds: [position.id] });

    expect(response.results[0]).toMatchObject({
      status: "no_snapshot",
      currentPrice: null,
      latestSnapshot: null,
      errorCode: "UNKNOWN",
    });
  });

  it("honors non-forced cooldown after provider failure", async () => {
    const repository = createRepository();
    vi.mocked(repository.getLatestSnapshotByAsset).mockResolvedValue(snapshot);
    vi.mocked(repository.listSnapshotsByAsset).mockResolvedValue([snapshot]);
    const provider = createProvider();
    vi.mocked(provider.fetchStockQuote).mockRejectedValue(new AlphaVantageClientError("Rate limited.", { code: "THROTTLED", status: 429 }));
    const cooldownCache = new Map<string, FailureCooldownEntry>();
    const service = createInvestmentMarketRefreshService({
      repository,
      alphaVantageClient: provider,
      env: { ALPHA_VANTAGE_API_KEY: "demo" },
      now: () => new Date("2026-06-13T10:00:00.000Z"),
      failureCooldownCache: cooldownCache,
    });

    await service.refreshPositions({ positionIds: [position.id] });
    const cooldownResponse = await service.refreshPositions({ positionIds: [position.id] });

    expect(provider.fetchStockQuote).toHaveBeenCalledTimes(1);
    expect(cooldownResponse.results[0]).toMatchObject({
      status: "cooldown",
      errorCode: "THROTTLED",
      refreshError: "Reintento pausado para evitar exceso de requests.",
      currentPrice: snapshot.price,
    });
  });

  it("returns validation errors for invalid payloads and missing resources", async () => {
    const repository = createRepository();
    const service = createInvestmentMarketRefreshService({ repository, failureCooldownCache: new Map() });

    await expect(service.refreshPositions({})).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    await expect(service.refreshPositions({ assets: [{ assetType: "bond", ticker: "AAPL" }] })).rejects.toMatchObject({ code: "INVALID_ASSET_TYPE", status: 400 });
    await expect(service.refreshPositions({ assets: [{ assetType: "stock", ticker: "***" }] })).rejects.toMatchObject({ code: "INVALID_TICKER", status: 400 });
    await expect(service.refreshPositions({ positionIds: ["missing"] })).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });
});

describe("investment positions refresh handler", () => {
  it("returns 405 and Allow header for unsupported methods", async () => {
    const response = createMockResponse<any>();
    const service = { refreshPositions: vi.fn() };
    const handler = createInvestmentPositionsRefreshHandler({ service });

    await handler(createMockRequest({ method: "GET" }), response);

    expect(response.statusCode).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(response.payload).toMatchObject({ code: "INVALID_REQUEST", status: 405 });
    expect(service.refreshPositions).not.toHaveBeenCalled();
  });

  it("passes POST payloads to the refresh service", async () => {
    const payload = { refreshedAt: "2026-06-12T10:00:00.000Z", results: [] };
    const service = { refreshPositions: vi.fn().mockResolvedValue(payload) };
    const response = createMockResponse<any>();
    const handler = createInvestmentPositionsRefreshHandler({ service });

    await handler(createMockRequest({ method: "POST", body: { positionIds: [position.id], force: true } }), response);

    expect(service.refreshPositions).toHaveBeenCalledWith({ positionIds: [position.id], force: true });
    expect(response.statusCode).toBe(200);
    expect(response.payload).toBe(payload);
  });
});
