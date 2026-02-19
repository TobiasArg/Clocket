import { describe, expect, it } from "vitest";
import { LocalStorageInvestmentsPortfolioRepository } from "./investmentsPortfolioRepository";

describe("LocalStorageInvestmentsPortfolioRepository", () => {
  it("derives amount from usd_gastado / buy_price", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();

    const created = await repository.addPosition({
      assetType: "crypto",
      ticker: "btc",
      usd_gastado: 750,
      buy_price: 250,
    });

    expect(created.ticker).toBe("BTC");
    expect(created.amount).toBe(3);

    const updated = await repository.editPosition(created.id, {
      usd_gastado: 1000,
      buy_price: 400,
    });

    expect(updated?.amount).toBe(2.5);
  });

  it("updates daily ref only when UTC day changes", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();

    await repository.addPosition({
      assetType: "stock",
      ticker: "AAPL",
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
  });

  it("updates month ref only when UTC month changes", async () => {
    const repository = new LocalStorageInvestmentsPortfolioRepository();

    await repository.addPosition({
      assetType: "stock",
      ticker: "MSFT",
      usd_gastado: 100,
      buy_price: 100,
    });

    await repository.addSnapshot({
      assetType: "stock",
      ticker: "MSFT",
      price: 100,
      source: "GLOBAL_QUOTE",
      timestamp: "2026-02-15T10:00:00.000Z",
    });

    const sameMonth = await repository.updateMonthRefIfNeeded(
      "stock",
      "MSFT",
      120,
      "2026-02-28T23:00:00.000Z",
    );

    expect(sameMonth.monthRefPrice).toBe(100);

    const nextMonth = await repository.updateMonthRefIfNeeded(
      "stock",
      "MSFT",
      140,
      "2026-03-01T00:00:00.000Z",
    );

    expect(nextMonth.monthRefPrice).toBe(140);
  });
});
