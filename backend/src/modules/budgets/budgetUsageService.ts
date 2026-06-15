import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import type { CategoryRecord, CategoriesRepository } from "../categories/categoriesRepository";
import type { TransactionRecord, TransactionsRepository } from "../transactions/transactionsRepository";
import {
  toBudgetResponse,
  type BudgetUsageDetailGroupResponse,
  type BudgetUsageDetailResponse,
  type BudgetUsageItemResponse,
  type BudgetUsageListResponse,
  type BudgetUsageSummaryResponse,
} from "./budgetsContracts";
import type { BudgetRecord, BudgetScopeRuleRecord, BudgetsRepository } from "./budgetsRepository";

export interface BudgetUsageService {
  listBudgetUsage: (query?: Record<string, string | string[] | undefined>) => Promise<BudgetUsageListResponse>;
  getBudgetUsageDetail: (id: string, query?: Record<string, string | string[] | undefined>) => Promise<BudgetUsageDetailResponse>;
}

const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;

const toCurrencyString = (value: number): string => value.toFixed(2);

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clampProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const rawProgress = (spentAmount: number, limitAmount: number): number => (
  limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0
);

const parsePeriodMonth = (query: Record<string, string | string[] | undefined> | undefined): string => {
  const value = query?.periodMonth ?? query?.month;
  if (typeof value !== "string" || !YEAR_MONTH_PATTERN.test(value)) {
    throw new CoreFinanceApiError("Query parameter 'periodMonth' must be a month string in YYYY-MM format.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  const parsed = new Date(`${value}-01T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 7) !== value) {
    throw new CoreFinanceApiError("Query parameter 'periodMonth' must be a valid month string.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  return value;
};

const getMonthDateWindow = (periodMonth: string): { dateFrom: string; dateTo: string } => {
  const [yearValue, monthValue] = periodMonth.split("-");
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
};

const isExpenseTransaction = (transaction: TransactionRecord): boolean => toNumber(transaction.amount) < 0;

const doesRuleMatchTransaction = (
  rule: BudgetScopeRuleRecord,
  transaction: TransactionRecord,
): boolean => {
  if (!transaction.categoryId || transaction.categoryId !== rule.categoryId) {
    return false;
  }

  if (rule.mode === "all_subcategories") {
    return true;
  }

  if (!transaction.subcategoryId) {
    return rule.includeNoSubcategory;
  }

  return rule.selectedSubcategoryIds.includes(transaction.subcategoryId);
};

const doesBudgetMatchTransaction = (budget: BudgetRecord, transaction: TransactionRecord): boolean => (
  budget.scopeRules.some((rule) => doesRuleMatchTransaction(rule, transaction))
);

const buildUsageItem = (
  budget: BudgetRecord,
  spentAmount: number,
): BudgetUsageItemResponse => {
  const limitAmount = toNumber(budget.limitAmount);
  const progress = rawProgress(spentAmount, limitAmount);
  return {
    budget: toBudgetResponse(budget),
    spentAmount: toCurrencyString(spentAmount),
    rawProgress: progress,
    clampedProgress: clampProgress(progress),
    remainingAmount: toCurrencyString(Math.max(0, limitAmount - spentAmount)),
    overspentAmount: toCurrencyString(Math.max(0, spentAmount - limitAmount)),
  };
};

const buildSummary = (items: BudgetUsageItemResponse[]): BudgetUsageSummaryResponse => {
  const totalLimitAmount = items.reduce((sum, item) => sum + toNumber(item.budget.limitAmount), 0);
  const totalSpentAmount = items.reduce((sum, item) => sum + toNumber(item.spentAmount), 0);
  const progress = rawProgress(totalSpentAmount, totalLimitAmount);
  return {
    totalLimitAmount: toCurrencyString(totalLimitAmount),
    totalSpentAmount: toCurrencyString(totalSpentAmount),
    rawProgress: progress,
    clampedProgress: clampProgress(progress),
    remainingAmount: toCurrencyString(Math.max(0, totalLimitAmount - totalSpentAmount)),
    overspentAmount: toCurrencyString(Math.max(0, totalSpentAmount - totalLimitAmount)),
  };
};

interface CategoryLookup {
  categoriesById: Map<string, CategoryRecord>;
  subcategoriesById: Map<string, { category: CategoryRecord; name: string }>;
}

const buildCategoryLookup = (categories: CategoryRecord[]): CategoryLookup => {
  const categoriesById = new Map<string, CategoryRecord>();
  const subcategoriesById = new Map<string, { category: CategoryRecord; name: string }>();
  categories.forEach((category) => {
    categoriesById.set(category.id, category);
    category.subcategories.forEach((subcategory) => {
      subcategoriesById.set(subcategory.id, { category, name: subcategory.name });
    });
  });
  return { categoriesById, subcategoriesById };
};

const buildDetailGroups = (
  budget: BudgetRecord,
  transactions: TransactionRecord[],
  categories: CategoryRecord[],
): BudgetUsageDetailGroupResponse[] => {
  const lookup = buildCategoryLookup(categories);
  const grouped = new Map<string, { categoryId: string | null; subcategoryId: string | null; label: string; amount: number }>();

  transactions.forEach((transaction) => {
    if (!isExpenseTransaction(transaction) || !doesBudgetMatchTransaction(budget, transaction)) {
      return;
    }

    const categoryId = transaction.categoryId;
    const subcategoryId = transaction.subcategoryId;
    const subcategoryMeta = subcategoryId ? lookup.subcategoriesById.get(subcategoryId) : null;
    const categoryMeta = categoryId ? lookup.categoriesById.get(categoryId) : null;
    const categoryName = subcategoryMeta?.category.name ?? categoryMeta?.name ?? "Categoría";
    const subcategoryName = subcategoryMeta?.name ?? "Sin subcategoría";
    const label = `${categoryName} · ${subcategoryName}`;
    const key = `${categoryId ?? "none"}:${subcategoryId ?? "none"}`;
    const amount = Math.abs(toNumber(transaction.amount));
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, { categoryId, subcategoryId, label, amount });
    } else {
      current.amount += amount;
    }
  });

  const total = Array.from(grouped.values()).reduce((sum, group) => sum + group.amount, 0);
  if (total <= 0) {
    return [];
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.amount - left.amount || left.label.localeCompare(right.label))
    .map((group) => ({
      categoryId: group.categoryId,
      subcategoryId: group.subcategoryId,
      label: group.label,
      amount: toCurrencyString(group.amount),
      percentageBasis: clampProgress((group.amount / total) * 100),
    }));
};

export const createBudgetUsageService = ({
  budgetsRepository,
  categoriesRepository,
  transactionsRepository,
}: {
  budgetsRepository: Pick<BudgetsRepository, "listActive" | "getById">;
  categoriesRepository: Pick<CategoriesRepository, "listActive">;
  transactionsRepository: Pick<TransactionsRepository, "listActive">;
}): BudgetUsageService => {
  const loadMonthlyInputs = async (periodMonth: string) => {
    const { dateFrom, dateTo } = getMonthDateWindow(periodMonth);
    const [budgets, transactions] = await Promise.all([
      budgetsRepository.listActive(periodMonth),
      transactionsRepository.listActive({ dateFrom, dateTo }),
    ]);
    return { budgets, transactions };
  };

  const buildUsageItems = (budgets: BudgetRecord[], transactions: TransactionRecord[]) => (
    budgets.map((budget) => {
      const spentAmount = transactions.reduce((sum, transaction) => {
        if (!isExpenseTransaction(transaction) || !doesBudgetMatchTransaction(budget, transaction)) {
          return sum;
        }
        return sum + Math.abs(toNumber(transaction.amount));
      }, 0);
      return buildUsageItem(budget, spentAmount);
    })
  );

  return {
    async listBudgetUsage(query = {}) {
      const periodMonth = parsePeriodMonth(query);
      const { budgets, transactions } = await loadMonthlyInputs(periodMonth);
      const items = buildUsageItems(budgets, transactions);
      return {
        periodMonth,
        summary: buildSummary(items),
        budgets: items,
      };
    },

    async getBudgetUsageDetail(id, query = {}) {
      const budget = await budgetsRepository.getById(id);
      if (!budget) {
        throw new CoreFinanceApiError(`Budget '${id}' was not found.`, { code: "NOT_FOUND", status: 404 });
      }
      const periodMonth = query.periodMonth || query.month ? parsePeriodMonth(query) : budget.periodMonth;
      const { dateFrom, dateTo } = getMonthDateWindow(periodMonth);
      const [transactions, categories] = await Promise.all([
        transactionsRepository.listActive({ dateFrom, dateTo }),
        categoriesRepository.listActive(),
      ]);
      const spentAmount = transactions.reduce((sum, transaction) => {
        if (!isExpenseTransaction(transaction) || !doesBudgetMatchTransaction(budget, transaction)) {
          return sum;
        }
        return sum + Math.abs(toNumber(transaction.amount));
      }, 0);
      const usage = buildUsageItem(budget, spentAmount);
      return {
        periodMonth,
        budget: toBudgetResponse(budget),
        usage,
        groups: buildDetailGroups(budget, transactions, categories),
      };
    },
  };
};
