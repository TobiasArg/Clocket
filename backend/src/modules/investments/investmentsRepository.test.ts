import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { createInvestmentsRepository } from "./investmentsRepository";

const assetId = "00000000-0000-4000-8000-000000010001";
const positionId = "00000000-0000-4000-8000-000000020001";
const entryId = "00000000-0000-4000-8000-000000030001";
const transactionId = "00000000-0000-4000-8000-000000040001";

const baseAsset = {
  id: assetId,
  assetType: "STOCK" as const,
  ticker: "AAPL",
  displayName: "Apple",
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-01T10:00:00.000Z"),
  refs: null,
};

const basePosition = {
  id: positionId,
  assetId,
  totalInvested: new Prisma.Decimal("100.00"),
  averageBuyPrice: new Prisma.Decimal("25.0000000000"),
  amount: new Prisma.Decimal("4.0000000000"),
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-01T10:00:00.000Z"),
  deletedAt: null,
  asset: baseAsset,
};

const baseEntry = {
  id: entryId,
  positionId,
  assetId,
  entryType: "INCOME" as const,
  amountUsd: new Prisma.Decimal("100.00"),
  buyPrice: new Prisma.Decimal("25.0000000000"),
  units: new Prisma.Decimal("4.0000000000"),
  transactionId: null,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  asset: baseAsset,
};

const createTransactionClientMock = () => ({
  investmentAsset: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  investmentPosition: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  investmentEntry: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  marketQuoteSnapshot: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  investmentAssetRef: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  transaction: {
    findFirst: vi.fn(),
  },
});

const createPrismaMock = () => {
  const tx = createTransactionClientMock();
  return {
    tx,
    prisma: {
      ...createTransactionClientMock(),
      $transaction: vi.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx)),
    },
  };
};

describe("createInvestmentsRepository", () => {
  it("normalizes stock tickers and creates income entries transactionally", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.investmentAsset.upsert.mockResolvedValue(baseAsset);
    tx.investmentPosition.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(basePosition);
    tx.investmentPosition.create.mockResolvedValue(basePosition);
    tx.investmentEntry.create.mockResolvedValue(baseEntry);
    tx.investmentEntry.findMany.mockResolvedValue([baseEntry]);
    tx.investmentPosition.update.mockResolvedValue(basePosition);
    const repository = createInvestmentsRepository(prisma as unknown as PrismaClient);

    await expect(repository.addEntry({
      assetType: "stock",
      ticker: " aapl ",
      displayName: " Apple ",
      entryType: "ingreso",
      usd_gastado: "100.00",
      buy_price: "25.00",
      createdAt: "2026-06-01T10:00:00.000Z",
    })).resolves.toEqual({
      position: expect.objectContaining({
        assetType: "stock",
        ticker: "AAPL",
        usd_gastado: "100.00",
        buy_price: "25.0000000000",
        amount: "4.0000000000",
      }),
      entry: expect.objectContaining({
        entryType: "ingreso",
        ticker: "AAPL",
      }),
    });

    expect(tx.investmentAsset.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { assetType_ticker: { assetType: "STOCK", ticker: "AAPL" } },
      create: expect.objectContaining({ assetType: "STOCK", ticker: "AAPL", displayName: "Apple" }),
    }));
    expect(tx.investmentEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        entryType: "INCOME",
        amountUsd: new Prisma.Decimal("100.00"),
        buyPrice: new Prisma.Decimal("25.00"),
        units: new Prisma.Decimal("4.0000000000"),
      }),
    }));
  });

  it("rejects oversold expense entries", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.investmentAsset.upsert.mockResolvedValue(baseAsset);
    tx.investmentPosition.findUnique.mockResolvedValue(basePosition);
    tx.investmentEntry.findMany.mockResolvedValue([baseEntry]);
    const repository = createInvestmentsRepository(prisma as unknown as PrismaClient);

    await expect(repository.addEntry({
      assetType: "stock",
      ticker: "AAPL",
      entryType: "egreso",
      usd_gastado: "200.00",
      buy_price: "25.00",
    })).rejects.toMatchObject({ code: "OVERSOLD_POSITION" });
    expect(tx.investmentEntry.create).not.toHaveBeenCalled();
  });

  it("validates optional transaction links before creating entries", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.investmentAsset.upsert.mockResolvedValue(baseAsset);
    tx.investmentPosition.findUnique
      .mockResolvedValueOnce(basePosition)
      .mockResolvedValueOnce(basePosition);
    tx.transaction.findFirst.mockResolvedValue({ id: transactionId });
    tx.investmentEntry.findFirst.mockResolvedValue(null);
    tx.investmentEntry.create.mockResolvedValue({ ...baseEntry, transactionId });
    tx.investmentEntry.findMany.mockResolvedValue([{ ...baseEntry, transactionId }]);
    tx.investmentPosition.update.mockResolvedValue(basePosition);
    const repository = createInvestmentsRepository(prisma as unknown as PrismaClient);

    await repository.addEntry({
      assetType: "stock",
      ticker: "AAPL",
      entryType: "ingreso",
      usd_gastado: "100.00",
      buy_price: "25.00",
      transactionId,
    });

    expect(tx.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: transactionId, deletedAt: null },
      select: { id: true },
    });
    expect(tx.investmentEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ transactionId }),
    }));
  });

  it("deletes entries and rebuilds the materialized position", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.investmentEntry.findFirst.mockResolvedValue(baseEntry);
    tx.investmentEntry.delete.mockResolvedValue(baseEntry);
    tx.investmentPosition.findUnique.mockResolvedValue(basePosition);
    tx.investmentEntry.findMany.mockResolvedValue([]);
    tx.investmentPosition.update.mockResolvedValue({
      ...basePosition,
      totalInvested: new Prisma.Decimal(0),
      amount: new Prisma.Decimal(0),
      deletedAt: new Date("2026-06-02T10:00:00.000Z"),
    });
    const repository = createInvestmentsRepository(prisma as unknown as PrismaClient);

    await expect(repository.deleteEntry(entryId)).resolves.toBe(true);
    expect(tx.investmentEntry.delete).toHaveBeenCalledWith({ where: { id: entryId } });
    expect(tx.investmentPosition.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: positionId },
      data: expect.objectContaining({ deletedAt: expect.any(Date) as Date }),
    }));
  });

  it("persists snapshots and reads the latest snapshot by asset", async () => {
    const { prisma, tx } = createPrismaMock();
    const snapshot = {
      id: "00000000-0000-4000-8000-000000050001",
      assetId,
      price: new Prisma.Decimal("70000.0000000000"),
      source: "CURRENCY_EXCHANGE_RATE" as const,
      bid: new Prisma.Decimal("69990.0000000000"),
      ask: new Prisma.Decimal("70010.0000000000"),
      providerAsOf: new Date("2026-06-01T09:00:00.000Z"),
      fetchedAt: new Date("2026-06-01T10:00:00.000Z"),
      asset: { ...baseAsset, assetType: "CRYPTO" as const, ticker: "BTC" },
    };
    tx.investmentAsset.upsert.mockResolvedValue({ ...baseAsset, assetType: "CRYPTO", ticker: "BTC" });
    tx.marketQuoteSnapshot.create.mockResolvedValue(snapshot);
    prisma.investmentAsset.findUnique.mockResolvedValue({ ...baseAsset, assetType: "CRYPTO", ticker: "BTC" });
    prisma.marketQuoteSnapshot.findFirst.mockResolvedValue(snapshot);
    const repository = createInvestmentsRepository(prisma as unknown as PrismaClient);

    await expect(repository.addSnapshot({
      assetType: "crypto",
      ticker: " btc ",
      price: "70000",
      source: "CURRENCY_EXCHANGE_RATE",
      bid: "69990",
      ask: "70010",
      timestamp: "2026-06-01T09:00:00.000Z",
    })).resolves.toMatchObject({
      assetType: "crypto",
      ticker: "BTC",
      price: "70000.0000000000",
      bid: "69990.0000000000",
      ask: "70010.0000000000",
    });
    await expect(repository.getLatestSnapshotByAsset("crypto", "btc")).resolves.toMatchObject({
      ticker: "BTC",
      timestamp: "2026-06-01T09:00:00.000Z",
    });
    expect(prisma.marketQuoteSnapshot.findFirst).toHaveBeenCalledWith({
      where: { assetId },
      include: { asset: true },
      orderBy: [{ fetchedAt: "desc" }, { id: "desc" }],
    });
  });

  it("initializes and rolls over daily/monthly asset refs", async () => {
    const { prisma, tx } = createPrismaMock();
    const refs = {
      id: "00000000-0000-4000-8000-000000060001",
      assetId,
      dailyRefPrice: new Prisma.Decimal("100.0000000000"),
      dailyRefTimestamp: new Date("2026-06-01T10:00:00.000Z"),
      monthRefPrice: new Prisma.Decimal("100.0000000000"),
      monthRefTimestamp: new Date("2026-06-01T10:00:00.000Z"),
      updatedAt: new Date("2026-06-01T10:00:00.000Z"),
      asset: baseAsset,
    };
    tx.investmentAsset.upsert.mockResolvedValue(baseAsset);
    tx.investmentAssetRef.findUnique.mockResolvedValueOnce(null).mockResolvedValue(refs);
    tx.marketQuoteSnapshot.findFirst.mockResolvedValue(null);
    tx.investmentAssetRef.create.mockResolvedValue(refs);
    tx.investmentAssetRef.update.mockResolvedValue({
      ...refs,
      dailyRefPrice: new Prisma.Decimal("120.0000000000"),
      dailyRefTimestamp: new Date("2026-06-02T10:00:00.000Z"),
    });
    const repository = createInvestmentsRepository(prisma as unknown as PrismaClient);

    await expect(repository.getOrInitRefs("stock", "AAPL")).resolves.toMatchObject({
      dailyRefPrice: "100.0000000000",
      monthRefPrice: "100.0000000000",
    });
    await expect(repository.updateDailyRefIfNeeded(
      "stock",
      "AAPL",
      "120",
      "2026-06-02T10:00:00.000Z",
    )).resolves.toMatchObject({ dailyRefPrice: "120.0000000000" });
    expect(tx.investmentAssetRef.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { assetId },
      data: {
        dailyRefPrice: new Prisma.Decimal("120"),
        dailyRefTimestamp: new Date("2026-06-02T10:00:00.000Z"),
      },
    }));
  });

  it("reads asset refs without creating missing asset or ref records", async () => {
    const { prisma } = createPrismaMock();
    const refs = {
      id: "00000000-0000-4000-8000-000000060001",
      assetId,
      dailyRefPrice: new Prisma.Decimal("100.0000000000"),
      dailyRefTimestamp: new Date("2026-06-01T10:00:00.000Z"),
      monthRefPrice: new Prisma.Decimal("100.0000000000"),
      monthRefTimestamp: new Date("2026-06-01T10:00:00.000Z"),
      updatedAt: new Date("2026-06-01T10:00:00.000Z"),
      asset: baseAsset,
    };
    prisma.investmentAsset.findUnique.mockResolvedValue({ id: assetId });
    prisma.investmentAssetRef.findUnique.mockResolvedValue(refs);
    const repository = createInvestmentsRepository(prisma as unknown as PrismaClient);

    await expect(repository.getRefsByAsset("stock", "aapl")).resolves.toMatchObject({
      assetId,
      ticker: "AAPL",
      dailyRefPrice: "100.0000000000",
    });

    expect(prisma.investmentAsset.findUnique).toHaveBeenCalledWith({
      where: { assetType_ticker: { assetType: "STOCK", ticker: "AAPL" } },
      select: { id: true },
    });
    expect(prisma.investmentAsset.upsert).not.toHaveBeenCalled();
    expect(prisma.investmentAssetRef.create).not.toHaveBeenCalled();
  });

  it("returns null for missing read-only asset refs", async () => {
    const { prisma } = createPrismaMock();
    prisma.investmentAsset.findUnique.mockResolvedValue(null);
    const repository = createInvestmentsRepository(prisma as unknown as PrismaClient);

    await expect(repository.getRefsByAsset("stock", "MSFT")).resolves.toBeNull();
    expect(prisma.investmentAssetRef.findUnique).not.toHaveBeenCalled();
    expect(prisma.investmentAsset.upsert).not.toHaveBeenCalled();
  });
});
