import { useMemo, useState } from "react";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import {
  getTransactionDateForMonthBalance,
  type BudgetPlanItem,
} from "@/utils";

export interface BudgetCategoryMeta {
  icon: string;
  iconBg: string;
  name: string;
}

export interface BudgetCategoryOption {
  id: string;
  name: string;
}

export interface BudgetsSummary {
  overspentAmount: number;
  progress: number;
  rawProgress: number;
  totalBudget: number;
  totalSpent: number;
}

export interface UseBudgetsPageModelOptions {
  onAddClick?: () => void;
}

export interface UseBudgetsPageModelResult {
  categoryById: Map<string, BudgetCategoryMeta>;
  error: string | null;
  expensesByCategoryId: Map<string, number>;
  handleCreate: () => Promise<void>;
  handleNextMonth: () => void;
  handleOpenEditor: () => void;
  handlePreviousMonth: () => void;
  handleHeaderAction: () => void;
  isAmountValid: boolean;
  isCategoryValid: boolean;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  limitAmountInput: string;
  selectedCategoryId: string;
  selectedMonth: string;
  selectedMonthLabel: string;
  setLimitAmountInput: (value: string) => void;
  setSelectedCategoryId: (value: string) => void;
  showValidation: boolean;
  sortedCategories: BudgetCategoryOption[];
  summary: BudgetsSummary;
  visibleBudgets: BudgetPlanItem[];
}

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

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const YEAR_MONTH_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

const buildYearMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseYearMonthWindow = (yearMonth: string): { start: Date; end: Date } => {
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end };
  }

  const [yearValue, monthValue] = yearMonth.split("-");
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
  return { start, end };
};

const shiftYearMonth = (yearMonth: string, deltaMonths: number): string => {
  const window = parseYearMonthWindow(yearMonth);
  const shifted = new Date(
    window.start.getFullYear(),
    window.start.getMonth() + deltaMonths,
    1,
    0,
    0,
    0,
    0,
  );
  return buildYearMonth(shifted);
};

const formatYearMonthLabel = (yearMonth: string): string => {
  const window = parseYearMonthWindow(yearMonth);
  const formatted = YEAR_MONTH_FORMATTER.format(window.start);
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
};

export const useBudgetsPageModel = (
  options: UseBudgetsPageModelOptions = {},
): UseBudgetsPageModelResult => {
  const { onAddClick } = options;

  const {
    items: budgets,
    isLoading,
    error,
    create,
  } = useBudgets();
  const { items: categories } = useCategories();
  const { items: transactions } = useTransactions();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [limitAmountInput, setLimitAmountInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    buildYearMonth(new Date()),
  );

  const selectedMonthWindow = useMemo(
    () => parseYearMonthWindow(selectedMonth),
    [selectedMonth],
  );
  const selectedMonthLabel = useMemo(
    () => formatYearMonthLabel(selectedMonth),
    [selectedMonth],
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, BudgetCategoryMeta>();
    categories.forEach((category) => {
      if (!category.id) {
        return;
      }

      map.set(category.id, {
        name: category.name,
        icon: category.icon,
        iconBg: category.iconBg,
      });
    });
    return map;
  }, [categories]);

  const sortedCategories = useMemo<BudgetCategoryOption[]>(
    () => categories
      .filter((category) => Boolean(category.id))
      .map((category) => ({
        id: category.id as string,
        name: category.name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    [categories],
  );

  const expensesByCategoryId = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return;
      }

      if (
        transactionDate < selectedMonthWindow.start ||
        transactionDate >= selectedMonthWindow.end
      ) {
        return;
      }

      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0 || !transaction.categoryId) {
        return;
      }

      map.set(transaction.categoryId, (map.get(transaction.categoryId) ?? 0) + Math.abs(amount));
    });

    return map;
  }, [selectedMonthWindow, transactions]);

  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === selectedMonth),
    [budgets, selectedMonth],
  );

  const summary = useMemo<BudgetsSummary>(() => {
    const totalBudget = visibleBudgets.reduce((sum, item) => sum + item.limitAmount, 0);
    const totalSpent = visibleBudgets.reduce(
      (sum, item) => sum + (expensesByCategoryId.get(item.categoryId) ?? 0),
      0,
    );
    const rawProgress = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const progress = clampPercent(rawProgress);
    const overspentAmount = Math.max(0, totalSpent - totalBudget);

    return {
      overspentAmount,
      totalBudget,
      totalSpent,
      progress,
      rawProgress,
    };
  }, [expensesByCategoryId, visibleBudgets]);

  const limitAmountValue = Number(limitAmountInput);
  const isAmountValid = Number.isFinite(limitAmountValue) && limitAmountValue > 0;
  const isCategoryValid = selectedCategoryId.length > 0;
  const isFormValid = isAmountValid && isCategoryValid;

  const resetEditor = () => {
    setSelectedCategoryId("");
    setLimitAmountInput("");
    setShowValidation(false);
  };

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
    setShowValidation(false);
    onAddClick?.();
  };

  const handlePreviousMonth = () => {
    setSelectedMonth((current) => shiftYearMonth(current, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((current) => shiftYearMonth(current, 1));
  };

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      setIsEditorOpen(false);
      resetEditor();
    } else {
      handleOpenEditor();
      return;
    }

    onAddClick?.();
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const selectedCategory = categoryById.get(selectedCategoryId);
    const created = await create({
      categoryId: selectedCategoryId,
      name: selectedCategory?.name ?? "Uncategorized",
      limitAmount: limitAmountValue,
      month: selectedMonth,
    });

    if (!created) {
      return;
    }

    setIsEditorOpen(false);
    setSelectedCategoryId("");
    setLimitAmountInput("");
    setShowValidation(false);
  };

  return {
    categoryById,
    error,
    expensesByCategoryId,
    handleCreate,
    handleNextMonth,
    handleOpenEditor,
    handlePreviousMonth,
    handleHeaderAction,
    isAmountValid,
    isCategoryValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    limitAmountInput,
    selectedCategoryId,
    selectedMonth,
    selectedMonthLabel,
    setLimitAmountInput,
    setSelectedCategoryId,
    showValidation,
    sortedCategories,
    summary,
    visibleBudgets,
  };
};
