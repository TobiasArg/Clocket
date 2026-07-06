import { describe, expect, it, vi } from "vitest";
import { createBudgetsService } from "./budgetsService";
import type { BudgetRecord, BudgetsRepository } from "./budgetsRepository";

const budget = (overrides: Partial<BudgetRecord> = {}): BudgetRecord => ({
  id: "budget-1",
  categoryId: "category-1",
  name: "Food",
  limitAmount: "100.00",
  currency: "USD",
  periodMonth: "2026-06",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  scopeRules: [{ id: "scope-1", categoryId: "category-1", mode: "all_subcategories", selectedSubcategoryIds: [], includeNoSubcategory: true }],
  ...overrides,
});

const createRepository = (): BudgetsRepository => ({
  listActive: vi.fn().mockResolvedValue([budget()]),
  getById: vi.fn().mockResolvedValue(budget()),
  create: vi.fn().mockResolvedValue(budget({ id: "created" })),
  update: vi.fn().mockResolvedValue(budget({ name: "Updated" })),
  softDelete: vi.fn().mockResolvedValue(true),
  softDeleteAll: vi.fn().mockResolvedValue(1),
});

describe("budgets service", () => {
  it("validates periodMonth query before repository reads", async () => {
    const repository = createRepository();

    await expect(createBudgetsService({ repository }).listBudgets({ periodMonth: "2026-13" })).rejects.toMatchObject({
      code: "INVALID_REQUEST",
      status: 400,
    });
    expect(repository.listActive).not.toHaveBeenCalled();
  });

  it("rejects invalid budget money amounts before persistence", async () => {
    const repository = createRepository();

    await expect(createBudgetsService({ repository }).createBudget({
      name: "Food",
      limitAmount: "0",
      periodMonth: "2026-06",
      scopeRules: [{ categoryId: "category-1", mode: "all_subcategories" }],
    })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    await expect(createBudgetsService({ repository }).updateBudget("budget-1", { limitAmount: "10.123" })).rejects.toMatchObject({
      code: "INVALID_REQUEST",
      status: 400,
    });
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
