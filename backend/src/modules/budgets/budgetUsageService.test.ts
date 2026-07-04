import { describe, expect, it, vi } from "vitest";
import { createBudgetUsageService } from "./budgetUsageService";
import type { BudgetRecord } from "./budgetsRepository";
import type { TransactionRecord } from "../transactions/transactionsRepository";

const foodCategoryId = "cat-food";
const groceriesSubcategoryId = "sub-groceries";
const transportCategoryId = "cat-transport";

const foodBudget: BudgetRecord = {
  id: "budget-food",
  categoryId: foodCategoryId,
  name: "Food",
  limitAmount: "500.00",
  currency: "USD",
  periodMonth: "2026-06",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  scopeRules: [{
    id: "scope-food",
    categoryId: foodCategoryId,
    mode: "selected_subcategories",
    selectedSubcategoryIds: [groceriesSubcategoryId],
    includeNoSubcategory: true,
  }],
};

const transportBudget: BudgetRecord = {
  id: "budget-transport",
  categoryId: transportCategoryId,
  name: "Transport",
  limitAmount: "100.00",
  currency: "USD",
  periodMonth: "2026-06",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  scopeRules: [{
    id: "scope-transport",
    categoryId: transportCategoryId,
    mode: "all_subcategories",
    selectedSubcategoryIds: [],
    includeNoSubcategory: false,
  }],
};

const transaction = (overrides: Partial<TransactionRecord>): TransactionRecord => ({
  id: "transaction",
  accountId: "account-1",
  categoryId: null,
  subcategoryId: null,
  goalId: null,
  installmentPlanId: null,
  transactionType: "regular",
  name: "Transaction",
  amount: "0.00",
  currency: "USD",
  date: "2026-06-15",
  notes: null,
  uiIcon: null,
  uiIconBg: null,
  cuotaInstallmentIndex: null,
  cuotaInstallmentsCount: null,
  createdAt: "2026-06-15T00:00:00.000Z",
  updatedAt: "2026-06-15T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const createService = ({ budgets = [foodBudget], transactions = [] as TransactionRecord[] } = {}) => {
  const budgetsRepository = {
    listActive: vi.fn().mockResolvedValue(budgets),
    getById: vi.fn().mockResolvedValue(budgets[0] ?? null),
  };
  const transactionsRepository = {
    listActive: vi.fn().mockResolvedValue(transactions),
  };
  const categoriesRepository = {
    listActive: vi.fn().mockResolvedValue([{
      id: foodCategoryId,
      name: "Food",
      icon: "utensils",
      iconBg: "bg-[#111111]",
      createdAt: "now",
      updatedAt: "now",
      deletedAt: null,
      subcategories: [{
        id: groceriesSubcategoryId,
        categoryId: foodCategoryId,
        name: "Groceries",
        sortOrder: 0,
        createdAt: "now",
        updatedAt: "now",
      }],
    }]),
  };
  return {
    service: createBudgetUsageService({
      budgetsRepository,
      transactionsRepository,
      categoriesRepository,
      exchangeRateProvider: () => ({
        baseCurrency: "USD",
        quoteCurrency: "ARS",
        rate: 1500,
        source: "BACKEND_CONFIG",
        asOf: "2026-06-18T12:00:00.000Z",
        isStale: false,
        isDefault: false,
        isUnavailable: false,
        fallbackReason: null,
      }),
    }),
    budgetsRepository,
    transactionsRepository,
  };
};

describe("createBudgetUsageService", () => {
  it("computes monthly usage from matching expense transactions only", async () => {
    const { service, transactionsRepository } = createService({
      budgets: [foodBudget, transportBudget],
      transactions: [
        transaction({ id: "groceries", categoryId: foodCategoryId, subcategoryId: groceriesSubcategoryId, amount: "-120.00" }),
        transaction({ id: "none", categoryId: foodCategoryId, subcategoryId: null, amount: "-30.00" }),
        transaction({ id: "income", categoryId: foodCategoryId, subcategoryId: groceriesSubcategoryId, amount: "50.00" }),
        transaction({ id: "transport", categoryId: transportCategoryId, amount: "-130.00" }),
      ],
    });

    await expect(service.listBudgetUsage({ periodMonth: "2026-06" })).resolves.toMatchObject({
      periodMonth: "2026-06",
      summary: {
        totalLimitAmount: "600.00",
        totalSpentAmount: "280.00",
        rawProgress: 47,
        clampedProgress: 47,
        remainingAmount: "320.00",
        overspentAmount: "0.00",
      },
      budgets: [
        { budget: expect.objectContaining({ id: "budget-food" }), spentAmount: "150.00", rawProgress: 30 },
        { budget: expect.objectContaining({ id: "budget-transport" }), spentAmount: "130.00", rawProgress: 130, clampedProgress: 100, overspentAmount: "30.00" },
      ],
    });
    expect(transactionsRepository.listActive).toHaveBeenCalledWith({ dateFrom: "2026-06-01", dateTo: "2026-06-30" });
  });

  it("returns zero usage for budgets with no matching transactions", async () => {
    const { service } = createService({ budgets: [foodBudget], transactions: [] });

    await expect(service.listBudgetUsage({ periodMonth: "2026-06" })).resolves.toMatchObject({
      budgets: [{ spentAmount: "0.00", rawProgress: 0, remainingAmount: "500.00" }],
    });
  });

  it("builds detail groups with stable category and subcategory labels", async () => {
    const { service } = createService({
      budgets: [foodBudget],
      transactions: [
        transaction({ id: "groceries", categoryId: foodCategoryId, subcategoryId: groceriesSubcategoryId, amount: "-120.00" }),
        transaction({ id: "none", categoryId: foodCategoryId, subcategoryId: null, amount: "-30.00" }),
      ],
    });

    await expect(service.getBudgetUsageDetail(foodBudget.id, { periodMonth: "2026-06" })).resolves.toMatchObject({
      budget: expect.objectContaining({ id: foodBudget.id }),
      usage: { spentAmount: "150.00" },
      groups: [
        { categoryId: foodCategoryId, subcategoryId: groceriesSubcategoryId, label: "Food · Groceries", amount: "120.00", percentageBasis: 80 },
        { categoryId: foodCategoryId, subcategoryId: null, label: "Food · Sin subcategoría", amount: "30.00", percentageBasis: 20 },
      ],
    });
  });

  it("converts mixed budget limits and transactions to the requested display currency", async () => {
    const { service } = createService({
      budgets: [foodBudget],
      transactions: [
        transaction({ id: "groceries", categoryId: foodCategoryId, subcategoryId: groceriesSubcategoryId, amount: "-150000.00", currency: "ARS" }),
      ],
    });

    await expect(service.listBudgetUsage({ periodMonth: "2026-06", currency: "ARS" })).resolves.toMatchObject({
      summary: {
        totalLimitAmount: "750000.00",
        totalSpentAmount: "150000.00",
        rawProgress: 20,
      },
      budgets: [{ spentAmount: "150000.00", rawProgress: 20, remainingAmount: "600000.00" }],
    });
  });

  it("converts budget detail groups before calculating percentages", async () => {
    const { service } = createService({
      budgets: [foodBudget],
      transactions: [
        transaction({ id: "usd", categoryId: foodCategoryId, subcategoryId: groceriesSubcategoryId, amount: "-1.00", currency: "USD" }),
        transaction({ id: "ars", categoryId: foodCategoryId, subcategoryId: null, amount: "-1500.00", currency: "ARS" }),
      ],
    });

    await expect(service.getBudgetUsageDetail(foodBudget.id, { periodMonth: "2026-06", currency: "ARS" })).resolves.toMatchObject({
      usage: { spentAmount: "3000.00" },
      groups: [
        { amount: "1500.00", percentageBasis: 50 },
        { amount: "1500.00", percentageBasis: 50 },
      ],
    });
  });

  it("rejects invalid month and missing budget requests with controlled errors", async () => {
    const { service, budgetsRepository } = createService({ budgets: [] });
    budgetsRepository.getById.mockResolvedValue(null);

    await expect(service.listBudgetUsage({ periodMonth: "bad" })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    await expect(service.getBudgetUsageDetail("missing", { periodMonth: "2026-06" })).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });
});
