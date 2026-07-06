import { describe, expect, it, vi } from "vitest";
import { createInvestmentsService } from "./investmentsService";
import type { InvestmentsRepository } from "./investmentsRepository";

const position = {
  id: "position-1",
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  displayName: null,
  usd_gastado: "100.00",
  buy_price: "10.0000000000",
  amount: "10.0000000000",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
};

const entry = {
  id: "entry-1",
  positionId: "position-1",
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  entryType: "ingreso" as const,
  usd_gastado: "100.00",
  buy_price: "10.0000000000",
  amount: "10.0000000000",
  transactionId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const refs = {
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  dailyRefPrice: "10.0000000000",
  dailyRefTimestamp: "2026-06-01T00:00:00.000Z",
  monthRefPrice: "10.0000000000",
  monthRefTimestamp: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const createRepository = (): InvestmentsRepository => ({
  listPositions: vi.fn().mockResolvedValue([position]),
  getPositionById: vi.fn().mockResolvedValue(position),
  addPosition: vi.fn().mockResolvedValue(position),
  editPosition: vi.fn().mockResolvedValue(position),
  deletePosition: vi.fn().mockResolvedValue(true),
  listEntriesByPosition: vi.fn().mockResolvedValue([entry]),
  listEntriesByAsset: vi.fn().mockResolvedValue([entry]),
  addEntry: vi.fn().mockResolvedValue({ position, entry }),
  deleteEntry: vi.fn().mockResolvedValue(true),
  addSnapshot: vi.fn().mockResolvedValue({ id: "snap-1", assetId: "asset-1", assetType: "stock", ticker: "AAPL", timestamp: "2026-06-01T00:00:00.000Z", price: "10.0000000000", source: "GLOBAL_QUOTE", bid: null, ask: null, providerAsOf: null, fetchedAt: "2026-06-01T00:00:00.000Z" }),
  listSnapshotsByAsset: vi.fn().mockResolvedValue([]),
  getLatestSnapshotByAsset: vi.fn().mockResolvedValue(null),
  getOrInitRefs: vi.fn().mockResolvedValue(refs),
  getRefsByAsset: vi.fn().mockResolvedValue(refs),
  updateDailyRefIfNeeded: vi.fn().mockResolvedValue(refs),
  updateMonthRefIfNeeded: vi.fn().mockResolvedValue(refs),
  getRefsMap: vi.fn().mockResolvedValue({ "stock:AAPL": refs }),
  clearAll: vi.fn().mockResolvedValue(undefined),
});

describe("investments service", () => {
  it("validates and adds investment entries", async () => {
    const repository = createRepository();
    const service = createInvestmentsService({ repository });

    await expect(service.addEntry({ assetType: "stock", ticker: "aapl", entryType: "ingreso", usd_gastado: 100, buy_price: 10 })).resolves.toEqual({ position, entry });
    expect(repository.addEntry).toHaveBeenCalledWith(expect.objectContaining({ ticker: "AAPL" }));
  });

  it("returns refs maps and rejects invalid assets", async () => {
    const service = createInvestmentsService({ repository: createRepository() });

    await expect(service.getRefs()).resolves.toEqual({ refs: { "stock:AAPL": refs } });
    await expect(service.listEntriesByAsset({ assetType: "bond", ticker: "AAPL" })).rejects.toMatchObject({ code: "INVALID_ASSET_TYPE" });
  });

  it("reads refs without initializing missing assets", async () => {
    const repository = createRepository();
    await expect(createInvestmentsService({ repository }).getRefs({ assetType: "stock", ticker: "aapl" })).resolves.toEqual(refs);

    expect(repository.getRefsByAsset).toHaveBeenCalledWith("stock", "AAPL");
    expect(repository.getOrInitRefs).not.toHaveBeenCalled();
  });

  it("returns controlled errors for invalid tickers and missing refs", async () => {
    const repository = createRepository();
    vi.mocked(repository.getRefsByAsset).mockResolvedValue(null);
    const service = createInvestmentsService({ repository });

    await expect(service.addEntry({ assetType: "stock", ticker: "***", entryType: "ingreso", usd_gastado: 100, buy_price: 10 })).rejects.toMatchObject({
      code: "INVALID_TICKER",
      status: 400,
    });
    await expect(service.getRefs({ assetType: "stock", ticker: "MSFT" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });
});
