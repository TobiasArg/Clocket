import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LocalStorageBudgetsRepository,
} from "./budgetsRepository";

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

describe("LocalStorageBudgetsRepository", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: new InMemoryStorage(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("migrates legacy v1 budgets to scopeRules v2", async () => {
    const storageKey = "clocket.budgets.migration.test";
    window.localStorage.setItem(storageKey, JSON.stringify({
      version: 1,
      items: [
        {
          id: "budget_legacy_1",
          categoryId: "cat_food",
          name: "Comida",
          limitAmount: 120000,
          month: "2026-02",
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
    }));

    const repository = new LocalStorageBudgetsRepository(storageKey);
    const list = await repository.list();

    expect(list).toHaveLength(1);
    expect(list[0].categoryId).toBe("cat_food");
    expect(list[0].scopeRules).toEqual([
      {
        categoryId: "cat_food",
        mode: "all_subcategories",
      },
    ]);

    const persisted = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
    expect(persisted.version).toBe(2);
  });

  it("requires at least one valid scope rule on create", async () => {
    const repository = new LocalStorageBudgetsRepository("clocket.budgets.validation.test");

    await expect(repository.create({
      name: "Sin scope",
      limitAmount: 100,
      month: "2026-02",
      scopeRules: [],
    })).rejects.toThrow("Budget requires at least one category scope rule.");
  });

  it("normalizes scope rules and keeps primary category in updates", async () => {
    const repository = new LocalStorageBudgetsRepository("clocket.budgets.update.test");

    const created = await repository.create({
      name: "Servicios",
      limitAmount: 900,
      month: "2026-02",
      scopeRules: [
        { categoryId: "cat_services", mode: "all_subcategories" },
      ],
    });

    const updated = await repository.update(created.id, {
      scopeRules: [
        {
          categoryId: "cat_food",
          mode: "selected_subcategories",
          subcategoryNames: ["Delivery", "Delivery", ""],
        },
      ],
    });

    expect(updated).not.toBeNull();
    expect(updated?.categoryId).toBe("cat_food");
    expect(updated?.scopeRules).toEqual([
      {
        categoryId: "cat_food",
        mode: "selected_subcategories",
        subcategoryNames: ["Delivery"],
      },
    ]);
  });
});
