import { useMemo } from "react";
import type { SubcategoryItem } from "@/types";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import {
  formatCurrency,
  getCurrentMonthWindow,
  getTransactionDateForMonthBalance,
} from "@/utils";

export interface UseBudgetDetailPageModelOptions {
  budgetDescription?: string;
  budgetIcon?: string;
  budgetId?: string;
  budgetName?: string;
  percentBadgeText?: string;
  progressColor?: string;
  progressPercent?: number;
  progressRemainingLabel?: string;
  progressUsedLabel?: string;
  spentValue?: string;
  subcategories?: SubcategoryItem[];
}

export interface UseBudgetDetailPageModelResult {
  detailSubcategories: SubcategoryItem[];
  isEmpty: boolean;
  isLoading: boolean;
  resolvedBudgetDescription: string;
  resolvedBudgetIcon: string;
  resolvedBudgetName: string;
  resolvedPercentBadgeText: string;
  resolvedProgressColor: string;
  resolvedProgressPercent: number;
  resolvedProgressRemainingLabel: string;
  resolvedProgressTextColor: string;
  resolvedProgressUsedLabel: string;
  resolvedSpentValue: string;
}

const COLORS = [
  { dot: "bg-[#DC2626]", bar: "bg-[#DC2626]" },
  { dot: "bg-[#F97316]", bar: "bg-[#F97316]" },
  { dot: "bg-[#8B5CF6]", bar: "bg-[#8B5CF6]" },
  { dot: "bg-[#06B6D4]", bar: "bg-[#06B6D4]" },
] as const;

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

export const useBudgetDetailPageModel = (
  options: UseBudgetDetailPageModelOptions = {},
): UseBudgetDetailPageModelResult => {
  const {
    budgetDescription,
    budgetIcon,
    budgetId,
    budgetName,
    percentBadgeText,
    progressColor = "bg-[#DC2626]",
    progressPercent,
    progressRemainingLabel,
    progressUsedLabel,
    spentValue,
    subcategories,
  } = options;

  const { items: budgets, isLoading: isBudgetsLoading } = useBudgets();
  const { items: categories } = useCategories();
  const { items: transactions } = useTransactions();

  const monthWindow = useMemo(() => getCurrentMonthWindow(), []);
  const currentMonth = useMemo(() => {
    const year = monthWindow.start.getFullYear();
    const month = String(monthWindow.start.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [monthWindow]);

  const resolvedBudget = useMemo(() => {
    if (budgetId) {
      return budgets.find((budget) => budget.id === budgetId) ?? null;
    }

    return budgets.find((budget) => budget.month === currentMonth) ?? null;
  }, [budgetId, budgets, currentMonth]);

  const categoryMeta = useMemo(() => {
    if (!resolvedBudget) {
      return null;
    }

    return categories.find((category) => category.id === resolvedBudget.categoryId) ?? null;
  }, [categories, resolvedBudget]);

  const spentAmount = useMemo(() => {
    if (!resolvedBudget) {
      return 0;
    }

    return transactions.reduce((sum, transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return sum;
      }

      if (transactionDate < monthWindow.start || transactionDate >= monthWindow.end) {
        return sum;
      }

      if (transaction.categoryId !== resolvedBudget.categoryId) {
        return sum;
      }

      const amount = parseSignedAmount(transaction.amount);
      return amount < 0 ? sum + Math.abs(amount) : sum;
    }, 0);
  }, [monthWindow.end, monthWindow.start, resolvedBudget, transactions]);

  const detailSubcategories = useMemo<SubcategoryItem[]>(() => {
    if (subcategories) {
      return subcategories;
    }

    if (!resolvedBudget) {
      return [];
    }

    const grouped = new Map<string, number>();

    transactions.forEach((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return;
      }

      if (transactionDate < monthWindow.start || transactionDate >= monthWindow.end) {
        return;
      }

      if (transaction.categoryId !== resolvedBudget.categoryId) {
        return;
      }

      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0) {
        return;
      }

      grouped.set(transaction.name, (grouped.get(transaction.name) ?? 0) + Math.abs(amount));
    });

    const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return [];
    }

    return Array.from(grouped.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([name, amount], index) => {
        const percent = clampPercent((amount / total) * 100);
        const color = COLORS[index % COLORS.length];

        return {
          dotColor: color.dot,
          name,
          amount: formatCurrency(amount),
          percent: `${percent}%`,
          barColor: color.bar,
          barWidthPercent: percent,
        };
      });
  }, [monthWindow.end, monthWindow.start, resolvedBudget, subcategories, transactions]);

  const isLoading = isBudgetsLoading && !resolvedBudget;
  const isEmpty = !resolvedBudget;

  const budgetLimit = resolvedBudget?.limitAmount ?? 0;
  const resolvedProgressPercent = progressPercent ?? (
    budgetLimit > 0 ? clampPercent((spentAmount / budgetLimit) * 100) : 0
  );
  const remaining = Math.max(0, budgetLimit - spentAmount);

  const resolvedBudgetName = budgetName ?? resolvedBudget?.name ?? "";
  const resolvedBudgetIcon = budgetIcon ?? categoryMeta?.icon ?? "tag";
  const resolvedBudgetDescription = budgetDescription ?? "Seguimiento mensual";
  const resolvedSpentValue =
    spentValue ?? `${formatCurrency(spentAmount)} / ${formatCurrency(budgetLimit)}`;
  const resolvedPercentBadgeText = percentBadgeText ?? `${resolvedProgressPercent}% del budget`;
  const resolvedProgressUsedLabel = progressUsedLabel ?? `${resolvedProgressPercent}% usado`;
  const resolvedProgressRemainingLabel =
    progressRemainingLabel ?? `${formatCurrency(remaining)} restante`;
  const resolvedProgressTextColor = progressColor.startsWith("bg-")
    ? progressColor.replace("bg-", "text-")
    : "text-[#DC2626]";

  return {
    detailSubcategories,
    isEmpty,
    isLoading,
    resolvedBudgetDescription,
    resolvedBudgetIcon,
    resolvedBudgetName,
    resolvedPercentBadgeText,
    resolvedProgressColor: progressColor,
    resolvedProgressPercent,
    resolvedProgressRemainingLabel,
    resolvedProgressTextColor,
    resolvedProgressUsedLabel,
    resolvedSpentValue,
  };
};
