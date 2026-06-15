import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { createBudgetUsageCollectionHandler, createBudgetUsageItemHandler } from "./budgetsApiHandler";
import type { BudgetUsageService } from "./budgetUsageService";

const budget = {
  id: "budget-1",
  categoryId: "category-1",
  name: "Food",
  limitAmount: "500.00",
  currency: "USD" as const,
  periodMonth: "2026-06",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  scopeRules: [{
    id: "scope-1",
    categoryId: "category-1",
    mode: "all_subcategories" as const,
    selectedSubcategoryIds: [],
    includeNoSubcategory: false,
  }],
};

const usageItem = {
  budget,
  spentAmount: "120.00",
  rawProgress: 24,
  clampedProgress: 24,
  remainingAmount: "380.00",
  overspentAmount: "0.00",
};

const createService = (): BudgetUsageService => ({
  listBudgetUsage: vi.fn().mockResolvedValue({
    periodMonth: "2026-06",
    summary: {
      totalLimitAmount: "500.00",
      totalSpentAmount: "120.00",
      rawProgress: 24,
      clampedProgress: 24,
      remainingAmount: "380.00",
      overspentAmount: "0.00",
    },
    budgets: [usageItem],
  }),
  getBudgetUsageDetail: vi.fn().mockResolvedValue({
    periodMonth: "2026-06",
    budget,
    usage: usageItem,
    groups: [{ categoryId: "category-1", subcategoryId: null, label: "Food · Sin subcategoría", amount: "120.00", percentageBasis: 100 }],
  }),
});

describe("budget usage API handlers", () => {
  it("handles collection usage requests", async () => {
    const service = createService();
    const handler = createBudgetUsageCollectionHandler({ service });
    const response = createMockResponse();

    await handler(createMockRequest({ method: "GET", query: { periodMonth: "2026-06" } }), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({ periodMonth: "2026-06", budgets: [expect.any(Object)] });
    expect(service.listBudgetUsage).toHaveBeenCalledWith({ periodMonth: "2026-06" });
  });

  it("handles detail usage requests", async () => {
    const service = createService();
    const handler = createBudgetUsageItemHandler({ service });
    const response = createMockResponse();

    await handler(createMockRequest({ method: "GET", query: { id: "budget-1", periodMonth: "2026-06" } }), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({ budget: { id: "budget-1" }, groups: [expect.any(Object)] });
    expect(service.getBudgetUsageDetail).toHaveBeenCalledWith("budget-1", { id: "budget-1", periodMonth: "2026-06" });
  });

  it("maps errors and unsupported methods", async () => {
    const service = createService();
    vi.mocked(service.listBudgetUsage).mockRejectedValue(new CoreFinanceApiError("Invalid month.", { code: "INVALID_REQUEST", status: 400 }));
    const handler = createBudgetUsageCollectionHandler({ service });
    const invalidResponse = createMockResponse();
    const methodResponse = createMockResponse();

    await handler(createMockRequest({ method: "GET", query: { periodMonth: "bad" } }), invalidResponse);
    await handler(createMockRequest({ method: "POST", query: { periodMonth: "2026-06" } }), methodResponse);

    expect(invalidResponse.statusCode).toBe(400);
    expect(invalidResponse.payload).toMatchObject({ code: "INVALID_REQUEST" });
    expect(methodResponse.statusCode).toBe(405);
    expect(methodResponse.headers.get("Allow")).toBe("GET");
  });
});
