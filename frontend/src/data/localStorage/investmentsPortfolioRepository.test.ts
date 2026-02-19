import { describe, expect, it } from "vitest";
import { LocalStorageInvestmentsPortfolioRepository } from "./investmentsPortfolioRepository";

describe("LocalStorageInvestmentsPortfolioRepository", () => {
  it("agrupa entradas del mismo ticker en una sola position", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();

    const first = await repository.addEntry({
      assetType: "crypto",
      ticker: "btc",
      entryType: "ingreso",
      usd_gastado: 100,
      buy_price: 50_000,
    });

    const second = await repository.addEntry({
      assetType: "crypto",
      ticker: "BTC",
      entryType: "ingreso",
      usd_gastado: 50,
      buy_price: 60_000,
    });

    expect(first.position).not.toBeNull();
    expect(second.position).not.toBeNull();
    expect(first.position?.id).toBe(second.position?.id);

    const positions = await repository.listPositions();
    expect(positions).toHaveLength(1);
    expect(positions[0].ticker).toBe("BTC");

    const expectedAmount = 0.002 + 0.00083333;
    expect(positions[0].amount).toBeCloseTo(expectedAmount, 8);
    expect(positions[0].usd_gastado).toBe(150);
    expect(positions[0].buy_price).toBeCloseTo(150 / expectedAmount, 6);

    const entries = await repository.listEntriesByPosition(positions[0].id);
    expect(entries).toHaveLength(2);
    expect(entries[0].entryType).toBe("ingreso");
  });

  it("soporta egreso y recalcula neto sin crear nueva position", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();

    await repository.addEntry({
      assetType: "crypto",
      ticker: "BTC",
      entryType: "ingreso",
      usd_gastado: 100,
      buy_price: 50_000,
    });

    const movement = await repository.addEntry({
      assetType: "crypto",
      ticker: "BTC",
      entryType: "egreso",
      usd_gastado: 30,
      buy_price: 65_000,
    });

    expect(movement.position).not.toBeNull();

    const positions = await repository.listPositions();
    expect(positions).toHaveLength(1);
    expect(positions[0].id).toBe(movement.position?.id);

    const initialAmount = 0.002;
    const soldAmount = 0.00046154;
    const expectedAmount = initialAmount - soldAmount;

    expect(positions[0].amount).toBeCloseTo(expectedAmount, 8);
    expect(positions[0].usd_gastado).toBeLessThan(100);
  });

  it("rechaza egresos mayores al disponible", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();

    await repository.addEntry({
      assetType: "crypto",
      ticker: "BTC",
      entryType: "ingreso",
      usd_gastado: 100,
      buy_price: 50_000,
    });

    await expect(repository.addEntry({
      assetType: "crypto",
      ticker: "BTC",
      entryType: "egreso",
      usd_gastado: 200,
      buy_price: 60_000,
    })).rejects.toThrow("No podés egresar más cantidad");
  });

  it("actualiza refs diario y mensual con rollover UTC", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();

    await repository.addEntry({
      assetType: "stock",
      ticker: "AAPL",
      entryType: "ingreso",
      usd_gastado: 100,
      buy_price: 100,
    });

    await repository.addSnapshot({
      assetType: "stock",
      ticker: "AAPL",
      price: 100,
      source: "GLOBAL_QUOTE",
      timestamp: "2026-02-01T10:00:00.000Z",
    });

    const sameDay = await repository.updateDailyRefIfNeeded(
      "stock",
      "AAPL",
      120,
      "2026-02-01T14:00:00.000Z",
    );

    expect(sameDay.dailyRefPrice).toBe(100);

    const nextDay = await repository.updateDailyRefIfNeeded(
      "stock",
      "AAPL",
      140,
      "2026-02-02T01:00:00.000Z",
    );

    expect(nextDay.dailyRefPrice).toBe(140);

    const sameMonth = await repository.updateMonthRefIfNeeded(
      "stock",
      "AAPL",
      150,
      "2026-02-15T10:00:00.000Z",
    );

    expect(sameMonth.monthRefPrice).toBe(100);

    const nextMonth = await repository.updateMonthRefIfNeeded(
      "stock",
      "AAPL",
      160,
      "2026-03-01T00:00:00.000Z",
    );

    expect(nextMonth.monthRefPrice).toBe(160);
  });
});
