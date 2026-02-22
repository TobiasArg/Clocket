import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CategoryBreakdown,
  DonutSegment,
  StatisticsFlowDay,
} from "@/types";
import {
  TRANSACTION_EXPENSE_SOLID_COLOR,
  TRANSACTION_INCOME_SOLID_COLOR,
} from "@/constants";
import { useCategories } from "./useCategories";
import { useGoals } from "./useGoals";
import { useTransactions } from "./useTransactions";
import {
  formatCurrency,
  getMonthlyBalance,
  getTransactionDateForMonthBalance,
} from "@/utils";
import type { TransactionItem } from "@/domain/transactions/repository";

export interface StatisticsTrendPoint {
  label: string;
  value: number;
}

export type StatisticsScope = "historical" | "month" | "year";
export type StatisticsChartView = "day" | "week" | "month";

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
  flowByView: Record<StatisticsChartView, StatisticsFlowDay[]>;
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
  trendPointsByView: Record<StatisticsChartView, StatisticsTrendPoint[]>;
}

const DONUT_COLORS = ["#DC2626", "#2563EB", "#EA580C", "#71717A"] as const;
const FLOW_EXPENSE_COLORS = [TRANSACTION_EXPENSE_SOLID_COLOR] as const;
const FLOW_INCOME_COLOR = TRANSACTION_INCOME_SOLID_COLOR;
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

const clampPercentValue = (value: number): number => (
  Math.max(0, Math.min(100, value))
);

const roundToSingleDecimal = (value: number): number => (
  Math.round(value * 10) / 10
);

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const isGoalSavingTransaction = (transaction: TransactionItem): boolean => {
  return transaction.transactionType === "saving" || Boolean(transaction.goalId);
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

const buildDateKey = (date: Date): string => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
);

const buildWeekdayLabel = (date: Date): string => (
  new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", "").toUpperCase()
);

const buildDateLabel = (date: Date): string => (
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(date).replace(".", "")
);

const buildNumericDateLabel = (date: Date): string => (
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit" }).format(date)
);

const buildMonthYearLabel = (date: Date): string => (
  new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(date)
);

const sortByAmountDesc = (entries: [string, number][]): [string, number][] => (
  entries.sort((left, right) => right[1] - left[1])
);

const startOfDay = (value: Date): Date => (
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
);

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (value: Date): Date => {
  const next = startOfDay(value);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(next, diff);
};

interface ScopeRange {
  start: Date;
  end: Date;
}

const getScopeRange = (scope: StatisticsScope, now: Date): ScopeRange | null => {
  if (scope === "historical") {
    return null;
  }

  if (scope === "month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0),
    };
  }

  return {
    start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0),
  };
};

const isWithinRange = (value: Date, range: ScopeRange | null): boolean => {
  if (!range) {
    return true;
  }

  return value >= range.start && value < range.end;
};

interface TrendBucket {
  end: Date;
  label: string;
  start: Date;
}

const buildDayTrendBuckets = (now: Date): TrendBucket[] => {
  const today = startOfDay(now);
  const start = addDays(today, -6);

  return Array.from({ length: 7 }).map((_, index) => {
    const bucketStart = addDays(start, index);
    return {
      end: addDays(bucketStart, 1),
      label: buildWeekdayLabel(bucketStart),
      start: bucketStart,
    };
  });
};

const buildWeekTrendBuckets = (now: Date): TrendBucket[] => {
  const thisWeekStart = startOfWeek(now);
  const start = addDays(thisWeekStart, -7 * 7);

  return Array.from({ length: 8 }).map((_, index) => {
    const bucketStart = addDays(start, index * 7);
    return {
      end: addDays(bucketStart, 7),
      label: buildNumericDateLabel(bucketStart),
      start: bucketStart,
    };
  });
};

const buildMonthTrendBuckets = (now: Date): TrendBucket[] => {
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

  return Array.from({ length: 6 }).map((_, index) => {
    const bucketStart = new Date(start.getFullYear(), start.getMonth() + index, 1, 0, 0, 0, 0);
    return {
      end: new Date(bucketStart.getFullYear(), bucketStart.getMonth() + 1, 1, 0, 0, 0, 0),
      label: buildMonthLabel(bucketStart),
      start: bucketStart,
    };
  });
};

const buildGoalSavingsTrendPoints = (
  transactions: TransactionItem[],
  totalGoalAmount: number,
  buckets: TrendBucket[],
): StatisticsTrendPoint[] => {
  let cumulativeSaved = 0;

  return buckets.map((bucket) => {
    const bucketSaved = transactions.reduce((sum, transaction) => {
      const date = getTransactionDateForMonthBalance(transaction);
      if (!date || date < bucket.start || date >= bucket.end) {
        return sum;
      }

      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0) {
        return sum;
      }

      return sum + Math.abs(amount);
    }, 0);

    cumulativeSaved += bucketSaved;

    const percent = totalGoalAmount > 0
      ? (cumulativeSaved / totalGoalAmount) * 100
      : 0;

    return {
      label: bucket.label,
      value: roundToSingleDecimal(clampPercentValue(percent)),
    };
  });
};

interface FlowBucket {
  dateLabel: string;
  end: Date;
  expenseMap: Map<string, number>;
  expenseTotal: number;
  incomeMap: Map<string, number>;
  incomeTotal: number;
  key: string;
  label: string;
  start: Date;
}

const buildDayFlowBuckets = (now: Date): FlowBucket[] => {
  const today = startOfDay(now);
  const start = addDays(today, -6);

  return Array.from({ length: 7 }).map((_, index) => {
    const bucketStart = addDays(start, index);
    return {
      dateLabel: buildDateLabel(bucketStart),
      end: addDays(bucketStart, 1),
      expenseMap: new Map<string, number>(),
      expenseTotal: 0,
      incomeMap: new Map<string, number>(),
      incomeTotal: 0,
      key: buildDateKey(bucketStart),
      label: buildWeekdayLabel(bucketStart),
      start: bucketStart,
    };
  });
};

const buildWeekFlowBuckets = (now: Date): FlowBucket[] => {
  const thisWeekStart = startOfWeek(now);
  const start = addDays(thisWeekStart, -7 * 7);

  return Array.from({ length: 8 }).map((_, index) => {
    const bucketStart = addDays(start, index * 7);
    const bucketEnd = addDays(bucketStart, 7);
    const bucketEndInclusive = addDays(bucketEnd, -1);

    return {
      dateLabel: `${buildDateLabel(bucketStart)} - ${buildDateLabel(bucketEndInclusive)}`,
      end: bucketEnd,
      expenseMap: new Map<string, number>(),
      expenseTotal: 0,
      incomeMap: new Map<string, number>(),
      incomeTotal: 0,
      key: `${buildDateKey(bucketStart)}_week`,
      label: buildNumericDateLabel(bucketStart),
      start: bucketStart,
    };
  });
};

const buildMonthFlowBuckets = (now: Date): FlowBucket[] => {
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

  return Array.from({ length: 6 }).map((_, index) => {
    const bucketStart = new Date(start.getFullYear(), start.getMonth() + index, 1, 0, 0, 0, 0);
    const bucketEnd = new Date(bucketStart.getFullYear(), bucketStart.getMonth() + 1, 1, 0, 0, 0, 0);

    return {
      dateLabel: buildMonthYearLabel(bucketStart),
      end: bucketEnd,
      expenseMap: new Map<string, number>(),
      expenseTotal: 0,
      incomeMap: new Map<string, number>(),
      incomeTotal: 0,
      key: `${buildMonthKey(bucketStart)}_month`,
      label: buildMonthLabel(bucketStart),
      start: bucketStart,
    };
  });
};

const buildFlowRows = (
  transactions: TransactionItem[],
  categoryNameById: Map<string, string>,
  buckets: FlowBucket[],
): StatisticsFlowDay[] => {
  transactions.forEach((transaction) => {
    if (isGoalSavingTransaction(transaction)) {
      return;
    }

    const transactionDate = getTransactionDateForMonthBalance(transaction);
    if (!transactionDate) {
      return;
    }

    const bucket = buckets.find((entry) => (
      transactionDate >= entry.start && transactionDate < entry.end
    ));
    if (!bucket) {
      return;
    }

    const amount = parseSignedAmount(transaction.amount);
    if (amount === 0) {
      return;
    }

    const category = transaction.categoryId
      ? (categoryNameById.get(transaction.categoryId) ?? "Uncategorized")
      : (transaction.category || (amount > 0 ? "Ingreso" : "Uncategorized"));

    if (amount > 0) {
      bucket.incomeMap.set(category, (bucket.incomeMap.get(category) ?? 0) + amount);
      bucket.incomeTotal += amount;
      return;
    }

    const expenseAmount = Math.abs(amount);
    bucket.expenseMap.set(category, (bucket.expenseMap.get(category) ?? 0) + expenseAmount);
    bucket.expenseTotal += expenseAmount;
  });

  const expenseTotalsByCategory = new Map<string, number>();
  buckets.forEach((bucket) => {
    bucket.expenseMap.forEach((amount, category) => {
      expenseTotalsByCategory.set(category, (expenseTotalsByCategory.get(category) ?? 0) + amount);
    });
  });

  const expenseColorByCategory = new Map<string, string>();
  sortByAmountDesc(Array.from(expenseTotalsByCategory.entries()))
    .forEach(([category], index) => {
      expenseColorByCategory.set(category, FLOW_EXPENSE_COLORS[index % FLOW_EXPENSE_COLORS.length]);
    });

  return buckets.map((bucket) => ({
    dateKey: bucket.key,
    dateLabel: bucket.dateLabel,
    expenseByCategory: sortByAmountDesc(Array.from(bucket.expenseMap.entries()))
      .map(([category, amount]) => ({
        amount,
        category,
        color: expenseColorByCategory.get(category) ?? FLOW_EXPENSE_COLORS[0],
      })),
    expenseTotal: bucket.expenseTotal,
    incomeByCategory: sortByAmountDesc(Array.from(bucket.incomeMap.entries()))
      .map(([category, amount]) => ({
        amount,
        category,
        color: FLOW_INCOME_COLOR,
      })),
    incomeTotal: bucket.incomeTotal,
    label: bucket.label,
  }));
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
  const { items: goals } = useGoals();
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
    () => transactions.filter((transaction) => !isGoalSavingTransaction(transaction)),
    [transactions],
  );
  const savingsTransactions = useMemo(
    () => transactions.filter((transaction) => isGoalSavingTransaction(transaction)),
    [transactions],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STATISTICS_SCOPE_STORAGE_KEY, scope);
  }, [scope]);

  const scopedTransactions = useMemo(() => {
    const now = new Date();
    const scopeRange = getScopeRange(scope, now);

    return balanceTransactions.filter((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return false;
      }

      return isWithinRange(transactionDate, scopeRange);
    });
  }, [balanceTransactions, scope]);
  const scopedSavingTransactions = useMemo(() => {
    const now = new Date();
    const scopeRange = getScopeRange(scope, now);

    return savingsTransactions.filter((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return false;
      }

      return isWithinRange(transactionDate, scopeRange);
    });
  }, [savingsTransactions, scope]);

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

  const totalGoalsTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + Math.max(0, goal.targetAmount), 0),
    [goals],
  );

  const totalGoalsSaved = useMemo(
    () => scopedSavingTransactions.reduce((sum, transaction) => {
      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0) {
        return sum;
      }

      return sum + Math.abs(amount);
    }, 0),
    [scopedSavingTransactions],
  );

  const trendPointsByView = useMemo<Record<StatisticsChartView, StatisticsTrendPoint[]>>(() => {
    const now = new Date();
    return {
      day: buildGoalSavingsTrendPoints(scopedSavingTransactions, totalGoalsTarget, buildDayTrendBuckets(now)),
      month: buildGoalSavingsTrendPoints(scopedSavingTransactions, totalGoalsTarget, buildMonthTrendBuckets(now)),
      week: buildGoalSavingsTrendPoints(scopedSavingTransactions, totalGoalsTarget, buildWeekTrendBuckets(now)),
    };
  }, [scopedSavingTransactions, totalGoalsTarget]);

  const flowByView = useMemo<Record<StatisticsChartView, StatisticsFlowDay[]>>(() => {
    const now = new Date();
    return {
      day: buildFlowRows(scopedTransactions, categoryNameById, buildDayFlowBuckets(now)),
      month: buildFlowRows(scopedTransactions, categoryNameById, buildMonthFlowBuckets(now)),
      week: buildFlowRows(scopedTransactions, categoryNameById, buildWeekFlowBuckets(now)),
    };
  }, [categoryNameById, scopedTransactions]);
  const dailyFlow = flowByView.day;
  const trendPoints = trendPointsByView.day;

  const monthlyGoal = Math.max(0, totalGoalsTarget);
  const savingsPercent = monthlyGoal > 0
    ? clampPercent((totalGoalsSaved / monthlyGoal) * 100)
    : 0;

  return {
    categoryRows,
    dailyFlow,
    flowByView,
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
      savingsBadge ?? `${savingsPercent}%`,
    resolvedSavingsGoalValue:
      savingsGoalValue ?? formatCurrency(monthlyGoal),
    resolvedSavingsValue: savingsValue ?? formatCurrency(totalGoalsSaved),
    resolvedTotalExpenseValue:
      totalExpenseValue ?? formatCurrency(monthlyBalance.expense),
    resolvedTotalIncomeValue:
      totalIncomeValue ?? formatCurrency(monthlyBalance.income),
    trendPoints,
    trendPointsByView,
  };
};
