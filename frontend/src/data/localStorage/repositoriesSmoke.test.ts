import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ACCOUNT_ID } from "@/domain/accounts/repository";
import { TRANSACTIONS_CHANGED_EVENT } from "@/domain/transactions/repository";
import { getGoalCategoryName, getGoalColorOption } from "@/domain/goals/goalAppearance";
import { LocalStorageAppSettingsRepository, appSettingsRepository } from "@/data/localStorage/appSettingsRepository";
import { accountsRepository } from "@/data/localStorage/accountsRepository";
import { budgetsRepository } from "@/data/localStorage/budgetsRepository";
import { categoriesRepository } from "@/data/localStorage/categoriesRepository";
import { goalsRepository } from "@/data/localStorage/goalsRepository";
import { investmentsRepository } from "@/data/localStorage/investmentsRepository";
import {
  LocalStorageTransactionsRepository,
  transactionsRepository,
} from "@/data/localStorage/transactionsRepository";

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

describe("localStorage repositories smoke", () => {
  beforeEach(async () => {
    vi.stubGlobal("window", {
      localStorage: new InMemoryStorage(),
      dispatchEvent: vi.fn(),
    });

    await Promise.all([
      transactionsRepository.clearAll(),
      goalsRepository.clearAll(),
      budgetsRepository.clearAll(),
      investmentsRepository.clearAll(),
      accountsRepository.clearAll(),
      categoriesRepository.clearAll(),
      appSettingsRepository.reset(),
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("app settings repository supports get/update/reset", async () => {
    const repository = new LocalStorageAppSettingsRepository("clocket.settings.smoke");

    const defaults = await repository.get();
    expect(defaults.currency).toBe("USD");

    const updated = await repository.update({
      currency: "EUR",
      language: "en",
      notificationsEnabled: false,
    });
    expect(updated.currency).toBe("EUR");
    expect(updated.language).toBe("en");
    expect(updated.notificationsEnabled).toBe(false);

    const reset = await repository.reset();
    expect(reset.currency).toBe("USD");
    expect(reset.language).toBe("es");
    expect(reset.notificationsEnabled).toBe(true);
  });

  it("accounts repository removes related transactions on account delete", async () => {
    const account = await accountsRepository.create({
      name: "Cuenta temporal",
      balance: 0,
    });

    await transactionsRepository.create({
      icon: "wallet",
      iconBg: "bg-[#09090B]",
      name: "Compra",
      category: "General",
      amount: "-$1200",
      amountColor: "text-[#DC2626]",
      meta: "2026-01-10 • smoke",
      accountId: account.id,
      categoryId: "category_smoke",
      date: "2026-01-10",
    });

    const removed = await accountsRepository.remove(account.id);
    expect(removed).toBe(true);

    const transactions = await transactionsRepository.list();
    expect(transactions.some((item) => item.accountId === account.id)).toBe(false);
  });

  it("categories repository keeps protected categories and normalizes subcategories", async () => {
    const protectedCategory = await categoriesRepository.create({
      name: "Tarjeta de Credito",
      icon: "credit-card",
      iconBg: "bg-[#111827]",
    });

    const protectedRemoved = await categoriesRepository.remove(protectedCategory.id);
    expect(protectedRemoved).toBe(false);

    const created = await categoriesRepository.create({
      name: "Compras",
      icon: "shopping-bag",
      iconBg: "bg-[#2563EB]",
    });

    const updated = await categoriesRepository.update(created.id, {
      subcategories: ["Super", "Super", "  "],
    });

    expect(updated?.subcategories).toEqual(["Super"]);
    expect(updated?.subcategoryCount).toBe(1);
  });

  it("budgets repository supports create/update/remove", async () => {
    const created = await budgetsRepository.create({
      name: "Comida",
      categoryId: "category_food",
      limitAmount: 150000,
      month: "2026-02",
    });

    const updated = await budgetsRepository.update(created.id, {
      limitAmount: 200000,
    });

    expect(updated?.limitAmount).toBe(200000);

    expect(await budgetsRepository.remove(created.id)).toBe(true);
    expect(await budgetsRepository.remove(created.id)).toBe(false);
  });

  it("goals repository creates/syncs/removes linked category and rejects duplicate titles", async () => {
    const beforeCategories = await categoriesRepository.list();

    const created = await goalsRepository.create({
      title: "Viaje",
      description: "Ahorro para vacaciones",
      targetAmount: 500000,
      deadlineDate: "2026-12-31",
      icon: "airplane-tilt",
      colorKey: "sky",
    });

    const createdCategory = await categoriesRepository.getById(created.categoryId);
    expect(createdCategory?.name).toBe(getGoalCategoryName("Viaje"));
    expect(createdCategory?.iconBg).toBe(getGoalColorOption("sky").iconBgClass);

    await expect(goalsRepository.create({
      title: "  viaje ",
      description: "Duplicado",
      targetAmount: 10,
      deadlineDate: "2026-12-31",
      icon: "target",
      colorKey: "rose",
    })).rejects.toThrow("Goal title must be unique.");

    const updated = await goalsRepository.update(created.id, {
      title: "Viaje Europa",
      colorKey: "rose",
    });

    expect(updated?.title).toBe("Viaje Europa");

    const syncedCategory = await categoriesRepository.getById(updated!.categoryId);
    expect(syncedCategory?.name).toBe(getGoalCategoryName("Viaje Europa"));
    expect(syncedCategory?.iconBg).toBe(getGoalColorOption("rose").iconBgClass);

    expect(await goalsRepository.remove(created.id)).toBe(true);
    expect(await categoriesRepository.getById(updated!.categoryId)).toBeNull();

    const afterCategories = await categoriesRepository.list();
    expect(afterCategories.length).toBe(beforeCategories.length);
  });

  it("investments repository normalizes ticker and updates values", async () => {
    const created = await investmentsRepository.create({
      ticker: "aapl",
      name: "Apple",
      exchange: "NASDAQ",
      shares: 2,
      costBasis: 150,
      currentPrice: 180,
    });

    expect(created.ticker).toBe("AAPL");

    const updated = await investmentsRepository.update(created.id, {
      shares: 3,
    });

    expect(updated?.shares).toBe(3);
    expect(await investmentsRepository.remove(created.id)).toBe(true);
  });

  it("transactions repository migrates legacy payload, emits change event and validates saving goalId", async () => {
    const legacyKey = "clocket.transactions.legacy-smoke";
    window.localStorage.setItem(legacyKey, JSON.stringify({
      version: 1,
      items: [
        {
          id: "tx_legacy",
          icon: "wallet",
          iconBg: "bg-[#09090B]",
          name: "Legacy",
          category: "General",
          amount: "+$1000",
          amountColor: "text-[#16A34A]",
          meta: "2025-11-05 • legacy",
        },
      ],
    }));

    const legacyRepository = new LocalStorageTransactionsRepository(legacyKey);
    const migrated = await legacyRepository.list();

    expect(migrated).toHaveLength(1);
    expect(migrated[0].accountId).toBe(DEFAULT_ACCOUNT_ID);
    expect(migrated[0].transactionType).toBe("regular");
    expect(migrated[0].date).toBe("2025-11-05");

    await expect(legacyRepository.create({
      icon: "target",
      iconBg: "bg-[#0EA5E9]",
      name: "Aporte",
      category: "Goal",
      amount: "-$100",
      amountColor: "text-[#DC2626]",
      meta: "2026-01-01 • saving",
      accountId: DEFAULT_ACCOUNT_ID,
      date: "2026-01-01",
      transactionType: "saving",
    })).rejects.toThrow("Saving transactions require a goalId.");

    const eventsKey = "clocket.transactions.events-smoke";
    const eventRepository = new LocalStorageTransactionsRepository(eventsKey);
    const dispatchEvent = window.dispatchEvent as unknown as ReturnType<typeof vi.fn>;
    dispatchEvent.mockClear();

    await eventRepository.create({
      icon: "wallet",
      iconBg: "bg-[#111827]",
      name: "Ingreso",
      category: "General",
      amount: "+$500",
      amountColor: "text-[#16A34A]",
      meta: "2026-01-02 • smoke",
      accountId: DEFAULT_ACCOUNT_ID,
      date: "2026-01-02",
    });

    expect(dispatchEvent.mock.calls.length).toBeGreaterThan(0);
    const lastEvent = dispatchEvent.mock.calls[dispatchEvent.mock.calls.length - 1][0] as Event;
    expect(lastEvent.type).toBe(TRANSACTIONS_CHANGED_EVENT);
  });
});
