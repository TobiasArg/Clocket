import { describe, expect, it, vi } from "vitest";
import { createAnalyticsService } from "./analyticsService";
import type { AccountRecord } from "../accounts/accountsRepository";
import type { CategoryRecord } from "../categories/categoriesRepository";
import type { GoalRecord } from "../goals/goalsRepository";
import type { InstallmentPlanRecord } from "../installments/installmentPlansRepository";
import type { TransactionRecord } from "../transactions/transactionsRepository";

const now = () => new Date("2026-06-18T12:00:00.000Z");

const account = (overrides: Partial<AccountRecord> = {}): AccountRecord => ({
  id: "account-1",
  name: "Cash",
  balance: "0.00",
  currency: "ARS",
  icon: "wallet",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const category = (overrides: Partial<CategoryRecord> = {}): CategoryRecord => ({
  id: "cat-food",
  name: "Food",
  icon: "utensils",
  iconBg: "bg-[#DC2626]",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
  subcategories: [],
  ...overrides,
});

const goal = (overrides: Partial<GoalRecord> = {}): GoalRecord => ({
  id: "goal-1",
  title: "Trip",
  description: "Travel",
  targetAmount: "1000.00",
  currency: "ARS",
  deadlineDate: "2026-12-31",
  icon: "plane",
  colorKey: "emerald",
  categoryId: null,
  subcategoryId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const installment = (overrides: Partial<InstallmentPlanRecord> = {}): InstallmentPlanRecord => ({
  id: "plan-1",
  title: "Laptop",
  description: null,
  totalAmount: "1200.00",
  currency: "ARS",
  installmentsCount: 12,
  installmentAmount: "100.00",
  startMonth: "2026-01",
  paidInstallmentsCount: 5,
  categoryId: null,
  subcategoryId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const transaction = (overrides: Partial<TransactionRecord>): TransactionRecord => ({
  id: "transaction-1",
  accountId: "account-1",
  categoryId: null,
  subcategoryId: null,
  goalId: null,
  installmentPlanId: null,
  transactionType: "regular",
  name: "Transaction",
  amount: "0.00",
  currency: "ARS",
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

const createService = ({
  accounts = [account()],
  transactions = [] as TransactionRecord[],
  categories = [category()],
} = {}) => createAnalyticsService({
  accountsRepository: { listActive: vi.fn().mockResolvedValue(accounts) },
  categoriesRepository: { listActive: vi.fn().mockResolvedValue(categories) },
  goalsRepository: { listActive: vi.fn().mockResolvedValue([goal()]) },
  installmentPlansRepository: { listActive: vi.fn().mockResolvedValue([installment()]) },
  transactionsRepository: { listActive: vi.fn().mockResolvedValue(transactions) },
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
  now,
});

describe("createAnalyticsService", () => {
  it("computes home monthly income, expense, net, category breakdowns, and installments", async () => {
    const service = createService({
      accounts: [account({ balance: "100.00" })],
      transactions: [
        transaction({ id: "income", name: "Salary", amount: "1000.00" }),
        transaction({ id: "expense", name: "Lunch", categoryId: "cat-food", amount: "-150.00" }),
        transaction({ id: "saving", goalId: "goal-1", transactionType: "saving", amount: "-200.00" }),
      ],
    });

    await expect(service.getHomeAnalytics()).resolves.toMatchObject({
      periodMonth: "2026-06",
      totalBalance: "950.00",
      monthlyIncome: "1000.00",
      monthlyExpense: "150.00",
      spendingCategories: [{ label: "Food", percentage: 100, color: "bg-[#DC2626]" }],
      dashboardGoals: [{ id: "goal-1", progressPercent: 20 }],
      pendingInstallmentsTotal: "100.00",
      visibleInstallments: [{ name: "Laptop", progressLabel: "5/12 cuotas" }],
    });
  });

  it("includes opening balance in home account summaries", async () => {
    const service = createService({
      accounts: [account({ balance: "1000.00" })],
      transactions: [transaction({ id: "expense", amount: "-100.00" })],
    });

    await expect(service.getHomeAnalytics()).resolves.toMatchObject({
      totalBalance: "900.00",
      accountSummaries: [{ id: "account-1", balance: "900.00", expense: "100.00" }],
    });
  });

  it("converts mixed USD and ARS home analytics to the requested display currency", async () => {
    const service = createService({
      accounts: [account({ balance: "1.00", currency: "USD" })],
      transactions: [
        transaction({ id: "ars-income", amount: "1500.00", currency: "ARS" }),
        transaction({ id: "usd-expense", amount: "-1.00", currency: "USD" }),
      ],
    });

    await expect(service.getHomeAnalytics({ currency: "ARS" })).resolves.toMatchObject({
      totalBalance: "1500.00",
      monthlyIncome: "1500.00",
      monthlyExpense: "1500.00",
      accountSummaries: [{ balance: "1500.00", income: "1500.00", expense: "1500.00" }],
    });
  });

  it("builds statistics read models with fallback categories and savings trends", async () => {
    const service = createService({
      categories: [],
      transactions: [
        transaction({ id: "income", amount: "500.00" }),
        transaction({ id: "missing-category", categoryId: "deleted", amount: "-125.00" }),
        transaction({ id: "saving", goalId: "goal-1", transactionType: "saving", amount: "-250.00" }),
      ],
    });

    const result = await service.getStatisticsAnalytics({ scope: "month" });

    expect(result.monthlyBalance).toEqual({ income: "500.00", expense: "125.00", net: "375.00" });
    expect(result.categoryRows).toMatchObject([{ name: "Uncategorized", amount: "125.00", percentage: 100 }]);
    expect(result.monthlyTransactionsCount).toBe(2);
    expect(result.trendPointsByView.day).toHaveLength(7);
    expect(result.trendPointsByView.week).toHaveLength(8);
    expect(result.trendPointsByView.month).toHaveLength(6);
    expect(result.trendPointsByView.month.at(-1)).toMatchObject({ bucketSaved: "250.00", cumulativeSaved: "250.00", value: 25 });
    expect(result.flowByView.day.every((bucket) => "rangeStart" in bucket && "rangeEnd" in bucket)).toBe(true);
  });

  it("converts mixed USD and ARS statistics aggregates to the requested display currency", async () => {
    const service = createService({
      transactions: [
        transaction({ id: "ars-income", amount: "3000.00", currency: "ARS" }),
        transaction({ id: "usd-expense", categoryId: "cat-food", amount: "-1.00", currency: "USD" }),
        transaction({ id: "usd-saving", goalId: "goal-1", transactionType: "saving", amount: "-1.00", currency: "USD" }),
      ],
    });

    const result = await service.getStatisticsAnalytics({ scope: "month", currency: "ARS" });

    expect(result.monthlyBalance).toEqual({ income: "3000.00", expense: "1500.00", net: "1500.00" });
    expect(result.categoryRows).toMatchObject([{ amount: "1500.00", percentage: 100 }]);
    expect(result.totalGoalsSaved).toBe("1500.00");
  });

  it("returns empty-state responses and rejects invalid query params", async () => {
    const service = createService({ transactions: [] });

    await expect(service.getStatisticsAnalytics({ scope: "historical" })).resolves.toMatchObject({
      monthlyBalance: { income: "0.00", expense: "0.00", net: "0.00" },
      categoryRows: [],
      monthlyTransactionsCount: 0,
    });
    await expect(service.getStatisticsAnalytics({ scope: "bad" })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    await expect(service.getStatisticsAnalytics({ view: "year" })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
  });
});
