import { useCallback, useMemo, useState } from "react";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  getCategoryColorOption,
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
  icon: string;
  iconBg: string;
  name: string;
}

export interface BudgetCategoryColorOption {
  key: string;
  label: string;
  swatchClass: string;
}

export interface BudgetCreateCategoryInput {
  colorKey: string;
  icon: string;
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
  budgetFormValidationLabel: string | null;
  budgetNameInput: string;
  categoryColorOptions: BudgetCategoryColorOption[];
  categoryIconOptions: string[];
  categoryById: Map<string, BudgetCategoryMeta>;
  categoriesError: string | null;
  error: string | null;
  expensesByCategoryId: Map<string, number>;
  handleCloseEditor: () => void;
  handleCreateCategory: (input: BudgetCreateCategoryInput) => Promise<BudgetCategoryOption | null>;
  handleCreate: () => Promise<void>;
  handleNextMonth: () => void;
  handleOpenEditor: () => void;
  handlePreviousMonth: () => void;
  handleHeaderAction: () => void;
  isAmountValid: boolean;
  isBudgetNameValid: boolean;
  isCategoriesLoading: boolean;
  isDuplicateCategoryMonth: boolean;
  isCategoryValid: boolean;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  limitAmountInput: string;
  selectedCategoryId: string;
  selectedMonth: string;
  selectedMonthLabel: string;
  setBudgetNameInput: (value: string) => void;
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
    isLoading: isBudgetsLoading,
    error: budgetsError,
    create,
  } = useBudgets();
  const {
    items: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    create: createCategory,
  } = useCategories();
  const { items: transactions } = useTransactions();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryIdState] = useState<string>("");
  const [budgetNameInput, setBudgetNameInput] = useState<string>("");
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
        icon: category.icon,
        iconBg: category.iconBg,
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

  const categoryColorOptions = useMemo<BudgetCategoryColorOption[]>(
    () => CATEGORY_COLOR_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      swatchClass: option.iconBgClass,
    })),
    [],
  );
  const categoryIconOptions = useMemo<string[]>(
    () => [...CATEGORY_ICON_OPTIONS],
    [],
  );

  const setSelectedCategoryId = useCallback((value: string) => {
    const nextId = value.trim();
    setSelectedCategoryIdState(nextId);

    if (nextId.length === 0) {
      return;
    }

    setBudgetNameInput((current) => {
      if (current.trim().length > 0) {
        return current;
      }

      const selectedCategory = sortedCategories.find((category) => category.id === nextId);
      return selectedCategory?.name ?? current;
    });
  }, [sortedCategories]);

  const limitAmountValue = Number(limitAmountInput);
  const normalizedBudgetName = budgetNameInput.trim();
  const isAmountValid = Number.isFinite(limitAmountValue) && limitAmountValue > 0;
  const isBudgetNameValid = normalizedBudgetName.length > 0;
  const isCategoryValid = selectedCategoryId.length > 0;
  const isDuplicateCategoryMonth = selectedCategoryId.length > 0
    && budgets.some((budget) => (
      budget.categoryId === selectedCategoryId && budget.month === selectedMonth
    ));
  const isFormValid = isAmountValid && isBudgetNameValid && isCategoryValid && !isDuplicateCategoryMonth;
  const budgetFormValidationLabel = showValidation && isDuplicateCategoryMonth
    ? "Ya existe un budget para esta categoría en el mes seleccionado."
    : null;

  const resetEditor = () => {
    setSelectedCategoryIdState("");
    setBudgetNameInput("");
    setLimitAmountInput("");
    setShowValidation(false);
  };

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
    setShowValidation(false);
    onAddClick?.();
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    resetEditor();
  };

  const handlePreviousMonth = () => {
    setSelectedMonth((current) => shiftYearMonth(current, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((current) => shiftYearMonth(current, 1));
  };

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      handleCloseEditor();
      onAddClick?.();
    } else {
      handleOpenEditor();
    }
  };

  const handleCreateCategory = async (
    input: BudgetCreateCategoryInput,
  ): Promise<BudgetCategoryOption | null> => {
    const normalizedName = input.name.trim();
    if (normalizedName.length === 0) {
      return null;
    }

    const normalizedIcon = input.icon.trim().length > 0 ? input.icon.trim() : DEFAULT_CATEGORY_ICON;
    const resolvedColorKey = CATEGORY_COLOR_OPTIONS.find((option) => option.key === input.colorKey)?.key
      ?? DEFAULT_CATEGORY_COLOR_KEY;
    const iconBg = getCategoryColorOption(resolvedColorKey).iconBgClass;

    const created = await createCategory({
      name: normalizedName,
      icon: normalizedIcon,
      iconBg,
    });
    if (!created?.id) {
      return null;
    }

    setSelectedCategoryIdState(created.id);
    setBudgetNameInput((current) => current.trim().length > 0 ? current : created.name);

    return {
      id: created.id,
      name: created.name,
      icon: created.icon,
      iconBg: created.iconBg,
    };
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const selectedCategory = categoryById.get(selectedCategoryId);
    const created = await create({
      categoryId: selectedCategoryId,
      name: normalizedBudgetName || selectedCategory?.name || "Uncategorized",
      limitAmount: limitAmountValue,
      month: selectedMonth,
    });

    if (!created) {
      return;
    }

    setIsEditorOpen(false);
    resetEditor();
  };

  return {
    categoryById,
    categoriesError,
    budgetFormValidationLabel,
    budgetNameInput,
    categoryColorOptions,
    categoryIconOptions,
    error: budgetsError,
    expensesByCategoryId,
    handleCloseEditor,
    handleCreateCategory,
    handleCreate,
    handleNextMonth,
    handleOpenEditor,
    handlePreviousMonth,
    handleHeaderAction,
    isAmountValid,
    isBudgetNameValid,
    isCategoriesLoading,
    isDuplicateCategoryMonth,
    isCategoryValid,
    isEditorOpen,
    isFormValid,
    isLoading: isBudgetsLoading,
    limitAmountInput,
    selectedCategoryId,
    selectedMonth,
    selectedMonthLabel,
    setBudgetNameInput,
    setLimitAmountInput,
    setSelectedCategoryId,
    showValidation,
    sortedCategories,
    summary,
    visibleBudgets,
  };
};
