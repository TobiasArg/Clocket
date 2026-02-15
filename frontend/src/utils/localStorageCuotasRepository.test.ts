import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageCuotasRepository } from "./localStorageCuotasRepository";
import { accountsRepository } from "./localStorageAccountsRepository";
import { categoriesRepository } from "./localStorageCategoriesRepository";
import { transactionsRepository } from "./localStorageTransactionsRepository";

class InMemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  public get length(): number {
    return this.store.size;
  }

  public clear(): void {
    this.store.clear();
  }

  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  public key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  public removeItem(key: string): void {
    this.store.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("LocalStorageCuotasRepository date validation", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 15, 12, 0, 0, 0));
    vi.stubGlobal("window", {
      localStorage: new InMemoryStorage(),
    });

    await Promise.all([
      accountsRepository.clearAll(),
      categoriesRepository.clearAll(),
      transactionsRepository.clearAll(),
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const buildRepository = (): LocalStorageCuotasRepository => {
    return new LocalStorageCuotasRepository("clocket.cuotas.test");
  };

  it("rejects a createdAt date with a future year", async () => {
    const repository = buildRepository();

    await expect(repository.create({
      title: "Plan anual",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2027-01-01",
    })).rejects.toThrow("Created date cannot be in the future.");
  });

  it("rejects a createdAt date with a future month in the same year", async () => {
    const repository = buildRepository();

    await expect(repository.create({
      title: "Plan mensual",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-06-01",
    })).rejects.toThrow("Created date cannot be in the future.");
  });

  it("rejects a createdAt date with a future day in the same month", async () => {
    const repository = buildRepository();

    await expect(repository.create({
      title: "Plan diario",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-05-16",
    })).rejects.toThrow("Created date cannot be in the future.");
  });

  it("accepts a createdAt date equal to today", async () => {
    const repository = buildRepository();

    const created = await repository.create({
      title: "Plan hoy",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-05-15",
    });

    expect(created.createdAt.startsWith("2026-05-15")).toBe(true);
  });
});
