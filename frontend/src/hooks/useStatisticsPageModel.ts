import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CategoryBreakdown,
  DonutSegment,
  StatisticsFlowDay,
} from "@/types";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import {
  buildStatisticsDailyFlow,
  formatCurrency,
  getMonthlyBalance,
  getTransactionDateForMonthBalance,
} from "@/utils";

export interface StatisticsTrendPoint {
  label: string;
  value: number;
}

export type StatisticsScope = "historical" | "month" | "year";

export interface UseStatisticsPageModelOptions {
  categories?: CategoryBreakdown[];
  categoryTotal?: string;
  savingsBadge?: string;
  savingsGoalValue?: string;
  savingsValue?: string;
  totalExpenseValue?: string;
  totalIncomeValue?: string;
}

export interface UseStatisticsPageModelResult {
  categoryRows: CategoryBreakdown[];
  dailyFlow: StatisticsFlowDay[];
  donutSegments: DonutSegment[];
  isLoading: boolean;
  hasError: boolean;
  monthlyBalance: ReturnType<typeof getMonthlyBalance>;
  monthlyGoal: number;
  monthlyTransactionsCount: number;
  scope: StatisticsScope;
  scopeLabel: string;
  setScope: (scope: StatisticsScope) => void;
  resolvedCategoryTotal: string;
  resolvedSavingsBadge: string;
  resolvedSavingsGoalValue: string;
  resolvedSavingsValue: string;
  resolvedTotalExpenseValue: string;
  resolvedTotalIncomeValue: string;
  trendPoints: StatisticsTrendPoint[];
}

const DONUT_COLORS = ["#DC2626", "#2563EB", "#EA580C", "#71717A"] as const;
const STATISTICS_SCOPE_STORAGE_KEY = "clocket.statistics.scope";
const DEFAULT_SCOPE: StatisticsScope = "month";
const SCOPE_LABELS: Record<StatisticsScope, string> = {
  historical: "Histórico",
  month: "Este mes",
  year: "Este año",
};

const isStatisticsScope = (value: string): value is StatisticsScope =>
  value === "historical" || value === "month" || value === "year";

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const parsePercentFromLabel = (value: string): number => {
  const match = value.match(/\((\d+)%\)/);
  if (!match) {
    return 0;
  }

  return Number(match[1]);
};

const parseAmountLabelFromCategoryValue = (value: string): string => {
  const [amountPart] = value.split("(");
  const normalized = amountPart?.trim();
  return normalized && normalized.length > 0 ? normalized : value;
};

const buildMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const buildMonthLabel = (date: Date): string => {
  return new Intl.DateTimeFormat("es-ES", { month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
};

export const useStatisticsPageModel = (
  options: UseStatisticsPageModelOptions = {},
): UseStatisticsPageModelResult => {
  const {
    categories,
    categoryTotal,
    savingsBadge,
    savingsGoalValue,
    savingsValue,
    totalExpenseValue,
    totalIncomeValue,
  } = options;

  const { items: transactions, isLoading, error } = useTransactions();
  const { items: categoriesData } = useCategories();
  const [scope, setScopeState] = useState<StatisticsScope>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SCOPE;
    }

    const storedScope = window.localStorage.getItem(STATISTICS_SCOPE_STORAGE_KEY);
    if (storedScope && isStatisticsScope(storedScope)) {
      return storedScope;
    }

    return DEFAULT_SCOPE;
  });

  const setScope = useCallback((nextScope: StatisticsScope) => {
    setScopeState(nextScope);
  }, []);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categoriesData.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categoriesData]);

  const balanceTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.transactionType !== "saving"),
    [transactions],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STATISTICS_SCOPE_STORAGE_KEY, scope);
  }, [scope]);

  const scopedTransactions = useMemo(() => {
    if (scope === "historical") {
      return balanceTransactions;
    }

    const now = new Date();
    const scopeStart = scope === "month"
      ? new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      : new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const scopeEnd = scope === "month"
      ? new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
      : new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);

    return balanceTransactions.filter((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return false;
      }

      return transactionDate >= scopeStart && transactionDate < scopeEnd;
    });
  }, [balanceTransactions, scope]);

  const monthlyBalance = useMemo(() => {
    let income = 0;
    let expense = 0;

    scopedTransactions.forEach((transaction) => {
      const amount = parseSignedAmount(transaction.amount);
      if (amount > 0) {
        income += amount;
        return;
      }

      if (amount < 0) {
        expense += Math.abs(amount);
      }
    });

    return {
      income,
      expense,
      net: income - expense,
    };
  }, [scopedTransactions]);

  const computedCategoryRows = useMemo<CategoryBreakdown[]>(() => {
    const grouped = new Map<string, number>();

    scopedTransactions.forEach((transaction) => {
      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0) {
        return;
      }

      const categoryName = transaction.categoryId
        ? (categoryNameById.get(transaction.categoryId) ?? "Uncategorized")
        : (transaction.category || "Uncategorized");
      grouped.set(categoryName, (grouped.get(categoryName) ?? 0) + Math.abs(amount));
    });

    const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return [];
    }

    return Array.from(grouped.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([name, value], index) => {
        const percent = clampPercent((value / total) * 100);
        return {
          dotColor: `bg-[${DONUT_COLORS[index % DONUT_COLORS.length]}]`,
          name,
          value: `${formatCurrency(value)} (${percent}%)`,
        };
      });
  }, [categoryNameById, scopedTransactions]);

  const categoryRows = categories ?? computedCategoryRows;

  const donutSegments = useMemo<DonutSegment[]>(() => {
    return categoryRows.map((category, index) => {
      const percentage = parsePercentFromLabel(category.value);
      return {
        color: DONUT_COLORS[index % DONUT_COLORS.length],
        name: category.name,
        value: parseAmountLabelFromCategoryValue(category.value),
        percentage,
      };
    });
  }, [categoryRows]);

  const trendPoints = useMemo<StatisticsTrendPoint[]>(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: buildMonthKey(monthDate),
        label: buildMonthLabel(monthDate),
        income: 0,
        expense: 0,
      };
    });

    const monthByKey = new Map(months.map((month) => [month.key, month]));

    scopedTransactions.forEach((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return;
      }

      const key = buildMonthKey(transactionDate);
      const month = monthByKey.get(key);
      if (!month) {
        return;
      }

      const amount = parseSignedAmount(transaction.amount);
      if (amount > 0) {
        month.income += amount;
      } else if (amount < 0) {
        month.expense += Math.abs(amount);
      }
    });

    return months.map((month) => ({
      label: month.label,
      value: month.income - month.expense,
    }));
  }, [scopedTransactions]);

  const dailyFlow = useMemo<StatisticsFlowDay[]>(
    () => buildStatisticsDailyFlow({ categoryNameById, transactions: scopedTransactions }),
    [categoryNameById, scopedTransactions],
  );

  const net = monthlyBalance.net;
  const monthlyGoal = Math.max(0, monthlyBalance.income * 0.6);
  const savingsPercent = monthlyGoal > 0
    ? clampPercent((net / monthlyGoal) * 100)
    : 0;

  return {
    categoryRows,
    dailyFlow,
    donutSegments,
    isLoading,
    hasError: Boolean(error),
    monthlyBalance,
    monthlyGoal,
    monthlyTransactionsCount: scopedTransactions.length,
    scope,
    scopeLabel: SCOPE_LABELS[scope],
    setScope,
    resolvedCategoryTotal: categoryTotal ?? formatCurrency(monthlyBalance.expense),
    resolvedSavingsBadge:
      savingsBadge ?? `${net >= 0 ? "+" : ""}${savingsPercent}%`,
    resolvedSavingsGoalValue:
      savingsGoalValue ?? formatCurrency(monthlyGoal),
    resolvedSavingsValue: savingsValue ?? formatCurrency(net),
    resolvedTotalExpenseValue:
      totalExpenseValue ?? formatCurrency(monthlyBalance.expense),
    resolvedTotalIncomeValue:
      totalIncomeValue ?? formatCurrency(monthlyBalance.income),
    trendPoints,
  };
};
