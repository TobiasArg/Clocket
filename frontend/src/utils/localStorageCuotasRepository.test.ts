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

  const getPlanInstallmentTransactions = async (planId: string) => {
    const transactions = await transactionsRepository.list();
    return transactions
      .filter((transaction) => transaction.cuotaPlanId === planId)
      .sort((left, right) => {
        const leftIndex = left.cuotaInstallmentIndex ?? 0;
        const rightIndex = right.cuotaInstallmentIndex ?? 0;
        return leftIndex - rightIndex;
      });
  };

  it("creates a transaction when candidate date is before today", async () => {
    const repository = buildRepository();

    const created = await repository.create({
      title: "Plan pasado",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-03-10",
    });

    await repository.update(created.id, { paidInstallmentsCount: 1 });
    const planTransactions = await getPlanInstallmentTransactions(created.id);
    expect(planTransactions).toHaveLength(1);
    expect(planTransactions[0].date).toBe("2026-04-10");
    expect(planTransactions[0].cuotaInstallmentIndex).toBe(1);
  });

  it("creates a transaction when candidate date is equal to today", async () => {
    const repository = buildRepository();

    const created = await repository.create({
      title: "Plan hoy",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-04-15",
    });

    await repository.update(created.id, { paidInstallmentsCount: 1 });
    const planTransactions = await getPlanInstallmentTransactions(created.id);
    expect(planTransactions).toHaveLength(1);
    expect(planTransactions[0].date).toBe("2026-05-15");
    expect(planTransactions[0].cuotaInstallmentIndex).toBe(1);
  });

  it("does not create a transaction when candidate date is after today", async () => {
    const repository = buildRepository();

    const created = await repository.create({
      title: "Plan futuro",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-04-20",
    });

    await repository.update(created.id, { paidInstallmentsCount: 1 });
    const planTransactions = await getPlanInstallmentTransactions(created.id);
    expect(planTransactions).toHaveLength(0);
  });

  it("does not duplicate transaction for the same installment index", async () => {
    const repository = buildRepository();

    const created = await repository.create({
      title: "Plan idempotente",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-03-10",
    });

    await repository.update(created.id, { paidInstallmentsCount: 1 });
    await repository.update(created.id, { paidInstallmentsCount: 1 });

    const planTransactions = await getPlanInstallmentTransactions(created.id);
    expect(planTransactions).toHaveLength(1);
    expect(planTransactions[0].cuotaInstallmentIndex).toBe(1);
  });

  it("keeps valid installments only when later installment candidate is future", async () => {
    const repository = buildRepository();

    const created = await repository.create({
      title: "Plan mixto",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-03-20",
    });

    await repository.update(created.id, { paidInstallmentsCount: 2 });

    const planTransactions = await getPlanInstallmentTransactions(created.id);
    expect(planTransactions).toHaveLength(1);
    expect(planTransactions[0].cuotaInstallmentIndex).toBe(1);
    expect(planTransactions[0].date).toBe("2026-04-20");
  });

  it("rejects creation for future plan date", async () => {
    const repository = buildRepository();

    await expect(repository.create({
      title: "Plan inválido",
      totalAmount: 1200,
      installmentsCount: 12,
      createdAt: "2026-05-16",
    })).rejects.toThrow("Created date cannot be in the future.");
  });
});
