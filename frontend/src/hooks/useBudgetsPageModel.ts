import { useMemo, useState } from "react";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import {
  getCurrentMonthWindow,
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
  progress: number;
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
  handleHeaderAction: () => void;
  isAmountValid: boolean;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  limitAmountInput: string;
  selectedCategoryId: string;
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

  const currentMonthWindow = useMemo(() => getCurrentMonthWindow(), []);
  const currentMonth = useMemo(() => {
    const year = currentMonthWindow.start.getFullYear();
    const month = String(currentMonthWindow.start.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [currentMonthWindow]);

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
        transactionDate < currentMonthWindow.start ||
        transactionDate >= currentMonthWindow.end
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
  }, [currentMonthWindow, transactions]);

  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === currentMonth),
    [budgets, currentMonth],
  );

  const summary = useMemo<BudgetsSummary>(() => {
    const totalBudget = visibleBudgets.reduce((sum, item) => sum + item.limitAmount, 0);
    const totalSpent = visibleBudgets.reduce(
      (sum, item) => sum + (expensesByCategoryId.get(item.categoryId) ?? 0),
      0,
    );
    const progress = totalBudget > 0 ? clampPercent((totalSpent / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalSpent,
      progress,
    };
  }, [expensesByCategoryId, visibleBudgets]);

  const limitAmountValue = Number(limitAmountInput);
  const isAmountValid = Number.isFinite(limitAmountValue) && limitAmountValue > 0;
  const isCategoryValid = selectedCategoryId.length > 0;
  const isFormValid = isAmountValid && isCategoryValid;

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      setIsEditorOpen(false);
      setSelectedCategoryId("");
      setLimitAmountInput("");
      setShowValidation(false);
    } else {
      setIsEditorOpen(true);
      setShowValidation(false);
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
      month: currentMonth,
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
    handleHeaderAction,
    isAmountValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    limitAmountInput,
    selectedCategoryId,
    setLimitAmountInput,
    setSelectedCategoryId,
    showValidation,
    sortedCategories,
    summary,
    visibleBudgets,
  };
};
