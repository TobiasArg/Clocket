import { beforeEach, describe, expect, it, vi } from "vitest";

const { httpGetMock } = vi.hoisted(() => ({
  httpGetMock: vi.fn(),
}));

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    get: httpGetMock,
  }));
  const isAxiosError = (error: unknown): boolean => (
    typeof error === "object" && error !== null && "isAxiosError" in error
  );
  return { default: { create, isAxiosError }, create, isAxiosError };
});

import { HttpAnalyticsRepository } from "./analyticsRepository";

describe("HttpAnalyticsRepository", () => {
  beforeEach(() => {
    httpGetMock.mockReset();
  });

  it("maps home analytics to existing UI-shaped labels", async () => {
    httpGetMock.mockResolvedValue({
      data: {
        totalBalance: "850.00",
        monthlyIncome: "1000.00",
        monthlyExpense: "150.00",
        spendingTotal: "150.00",
        spendingCategories: [{ label: "Food", percentage: 100, color: "bg-[#DC2626]" }],
        recentTransactions: [{ key: "t1", icon: "utensils", iconBg: "bg-[#DC2626]", name: "Lunch", date: "2026-06-15", amount: "-150.00" }],
        dashboardGoals: [{ id: "g1", icon: "plane", name: "Trip", progressPercent: 20, colorKey: "emerald" }],
        accountSummaries: [{ id: "a1", label: "Cash", balance: "850.00", income: "1000.00", expense: "150.00" }],
        pendingInstallmentsTotal: "100.00",
        visibleInstallments: [{ name: "Laptop", progressLabel: "5/12 cuotas", amount: "100.00" }],
      },
    });

    const model = await new HttpAnalyticsRepository().getHome("ARS");

    expect(httpGetMock).toHaveBeenCalledWith("/api/analytics/home", { params: { currency: "ARS" } });
    expect(model.balanceSlides).toHaveLength(2);
    expect(model.displayedSpendingCategories).toEqual([{ label: "Food", percentage: 100, color: "bg-[#DC2626]" }]);
    expect(model.recentTransactions[0]).toMatchObject({ name: "Lunch", amountColor: "text-[var(--text-primary)]" });
    expect(model.recentTransactions[0].amount).toContain("150");
    expect(model.pendingInstallmentsLabel).toContain("100");
  });

  it("maps statistics analytics to chart-ready values and preserves scope request", async () => {
    httpGetMock.mockResolvedValue({
      data: {
        monthlyBalance: { income: "500.00", expense: "125.00", net: "375.00" },
        monthlyGoal: "1000.00",
        totalGoalsSaved: "250.00",
        monthlyTransactionsCount: 2,
        categoryRows: [{ dotColor: "bg-[#71717A]", name: "Uncategorized", amount: "125.00", percentage: 100 }],
        donutSegments: [{ color: "#71717A", name: "Uncategorized", amount: "125.00", percentage: 100 }],
        flowByView: {
          day: [{ dateKey: "2026-06-15", dateLabel: "15 jun", expenseByCategory: [{ amount: "125.00", category: "Uncategorized", color: "#71717A" }], expenseTotal: "125.00", incomeByCategory: [], incomeTotal: "0.00", label: "LUN" }],
          week: [],
          month: [],
        },
        trendPointsByView: {
          day: [{ bucketSaved: "250.00", cumulativeSaved: "250.00", goalSegments: [{ amount: "250.00", color: "#71717A", goalId: "g1", label: "Trip", percentOfBucket: 100 }], label: "LUN", rangeLabel: "15 jun - 15 jun", value: 25 }],
          week: [],
          month: [],
        },
      },
    });

    const model = await new HttpAnalyticsRepository().getStatistics("month", "ARS");

    expect(httpGetMock).toHaveBeenCalledWith("/api/analytics/statistics", { params: { scope: "month", currency: "ARS" } });
    expect(model.monthlyBalance).toEqual({ income: 500, expense: 125, net: 375 });
    expect(model.categoryRows[0].value).toContain("(100%)");
    expect(model.flowByView.day[0].expenseTotal).toBe(125);
    expect(model.trendPointsByView.day[0].goalSegments[0].amount).toBe(250);
    expect(model.resolvedSavingsBadge).toBe("25%");
  });
});
