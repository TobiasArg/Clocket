import { useCallback, useMemo, useState } from "react";
import type { SubcategoryItem } from "@/types";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  formatCurrency,
  getCategoryColorOption,
  getCurrentMonthWindow,
  getTransactionDateForMonthBalance,
} from "@/utils";

export interface UseBudgetDetailPageModelOptions {
  budgetDescription?: string;
  budgetIcon?: string;
  budgetId?: string;
  budgetName?: string;
  headerBg?: string;
  percentBadgeText?: string;
  progressColor?: string;
  progressPercent?: number;
  progressRemainingLabel?: string;
  progressUsedLabel?: string;
  spentValue?: string;
  subcategories?: SubcategoryItem[];
}

export interface BudgetDetailCategoryOption {
  id: string;
  icon: string;
  iconBg: string;
  name: string;
}

export interface BudgetDetailCategoryColorOption {
  key: string;
  label: string;
  swatchClass: string;
}

export interface BudgetDetailCreateCategoryInput {
  colorKey: string;
  icon: string;
  name: string;
}

export interface UseBudgetDetailPageModelResult {
  budgetFormValidationLabel: string | null;
  budgetNameInput: string;
  categoriesError: string | null;
  categoryColorOptions: BudgetDetailCategoryColorOption[];
  categoryIconOptions: string[];
  detailSubcategories: SubcategoryItem[];
  handleCloseEditor: () => void;
  handleCreateCategory: (
    input: BudgetDetailCreateCategoryInput,
  ) => Promise<BudgetDetailCategoryOption | null>;
  handleOpenEditor: () => void;
  handleSubmitEdit: () => Promise<void>;
  isAmountValid: boolean;
  isBudgetNameValid: boolean;
  isCategoriesLoading: boolean;
  isCategoryValid: boolean;
  isDuplicateCategoryMonth: boolean;
  isEditorOpen: boolean;
  isEditorSubmitting: boolean;
  isEmpty: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  limitAmountInput: string;
  resolvedBudgetDescription: string;
  resolvedBudgetIcon: string;
  resolvedBudgetName: string;
  resolvedHeaderBg: string;
  resolvedPercentBadgeText: string;
  resolvedProgressColor: string;
  resolvedProgressPercent: number;
  resolvedProgressRemainingLabel: string;
  resolvedProgressTextColor: string;
  resolvedProgressUsedLabel: string;
  resolvedSpentValue: string;
  selectedCategoryId: string;
  setBudgetNameInput: (value: string) => void;
  setLimitAmountInput: (value: string) => void;
  setSelectedCategoryId: (value: string) => void;
  showValidation: boolean;
  sortedCategories: BudgetDetailCategoryOption[];
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

const resolveMonthWindow = (
  yearMonth: string | undefined,
  fallback: { start: Date; end: Date },
): { start: Date; end: Date } => {
  if (!yearMonth || !YEAR_MONTH_PATTERN.test(yearMonth)) {
    return fallback;
  }

  const [yearValue, monthValue] = yearMonth.split("-");
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
  return { start, end };
};

const toTextToneClass = (bgClass: string): string => {
  if (bgClass.startsWith("bg-")) {
    return bgClass.replace("bg-", "text-");
  }

  return "text-[#DC2626]";
};

export const useBudgetDetailPageModel = (
  options: UseBudgetDetailPageModelOptions = {},
): UseBudgetDetailPageModelResult => {
  const {
    budgetDescription,
    budgetIcon,
    budgetId,
    budgetName,
    headerBg,
    percentBadgeText,
    progressColor,
    progressPercent,
    progressRemainingLabel,
    progressUsedLabel,
    spentValue,
    subcategories,
  } = options;

  const {
    items: budgets,
    isLoading: isBudgetsLoading,
    update,
  } = useBudgets();
  const {
    items: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    create: createCategory,
  } = useCategories();
  const { items: transactions } = useTransactions();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isEditorSubmitting, setIsEditorSubmitting] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryIdState] = useState<string>("");
  const [budgetNameInput, setBudgetNameInput] = useState<string>("");
  const [limitAmountInput, setLimitAmountInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const currentMonthWindow = useMemo(() => getCurrentMonthWindow(), []);
  const currentMonth = useMemo(() => {
    const year = currentMonthWindow.start.getFullYear();
    const month = String(currentMonthWindow.start.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [currentMonthWindow]);

  const resolvedBudget = useMemo(() => {
    if (budgetId) {
      return budgets.find((budget) => budget.id === budgetId) ?? null;
    }

    return budgets.find((budget) => budget.month === currentMonth) ?? null;
  }, [budgetId, budgets, currentMonth]);

  const sortedCategories = useMemo<BudgetDetailCategoryOption[]>(() => {
    return categories
      .filter((category) => Boolean(category.id))
      .map((category) => ({
        id: category.id as string,
        icon: category.icon,
        iconBg: category.iconBg,
        name: category.name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [categories]);

  const categoryColorOptions = useMemo<BudgetDetailCategoryColorOption[]>(() => {
    return CATEGORY_COLOR_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      swatchClass: option.iconBgClass,
    }));
  }, []);

  const categoryIconOptions = useMemo<string[]>(() => {
    return [...CATEGORY_ICON_OPTIONS];
  }, []);

  const categoryMeta = useMemo(() => {
    if (!resolvedBudget) {
      return null;
    }

    return categories.find((category) => category.id === resolvedBudget.categoryId) ?? null;
  }, [categories, resolvedBudget]);

  const selectedMonthWindow = useMemo(
    () => resolveMonthWindow(resolvedBudget?.month, currentMonthWindow),
    [currentMonthWindow, resolvedBudget?.month],
  );

  const spentAmount = useMemo(() => {
    if (!resolvedBudget) {
      return 0;
    }

    return transactions.reduce((sum, transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return sum;
      }

      if (transactionDate < selectedMonthWindow.start || transactionDate >= selectedMonthWindow.end) {
        return sum;
      }

      if (transaction.categoryId !== resolvedBudget.categoryId) {
        return sum;
      }

      const amount = parseSignedAmount(transaction.amount);
      return amount < 0 ? sum + Math.abs(amount) : sum;
    }, 0);
  }, [resolvedBudget, selectedMonthWindow.end, selectedMonthWindow.start, transactions]);

  const categoryAccentColor = categoryMeta?.iconBg ?? "bg-[#DC2626]";
  const resolvedProgressColor = progressColor ?? categoryAccentColor;
  const resolvedHeaderBg = headerBg ?? categoryAccentColor;

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

      if (transactionDate < selectedMonthWindow.start || transactionDate >= selectedMonthWindow.end) {
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
      .map(([name, amount]) => {
        const percent = clampPercent((amount / total) * 100);

        return {
          dotColor: resolvedProgressColor,
          name,
          amount: formatCurrency(amount),
          percent: `${percent}%`,
          barColor: resolvedProgressColor,
          barWidthPercent: percent,
        };
      });
  }, [resolvedBudget, resolvedProgressColor, selectedMonthWindow.end, selectedMonthWindow.start, subcategories, transactions]);

  const resetEditor = useCallback(() => {
    setSelectedCategoryIdState("");
    setBudgetNameInput("");
    setLimitAmountInput("");
    setShowValidation(false);
    setIsEditorSubmitting(false);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    resetEditor();
  }, [resetEditor]);

  const handleOpenEditor = useCallback(() => {
    if (!resolvedBudget) {
      return;
    }

    setIsEditorOpen(true);
    setSelectedCategoryIdState(resolvedBudget.categoryId);
    setBudgetNameInput(resolvedBudget.name);
    setLimitAmountInput(String(resolvedBudget.limitAmount));
    setShowValidation(false);
  }, [resolvedBudget]);

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

  const normalizedBudgetName = budgetNameInput.trim();
  const normalizedSelectedCategoryId = selectedCategoryId.trim();
  const limitAmountValue = Number(limitAmountInput);

  const isAmountValid = Number.isFinite(limitAmountValue) && limitAmountValue > 0;
  const isBudgetNameValid = normalizedBudgetName.length > 0;
  const isCategoryValid = normalizedSelectedCategoryId.length > 0
    && sortedCategories.some((category) => category.id === normalizedSelectedCategoryId);
  const isDuplicateCategoryMonth = resolvedBudget
    ? budgets.some((budget) => (
      budget.id !== resolvedBudget.id
      && budget.month === resolvedBudget.month
      && budget.categoryId === normalizedSelectedCategoryId
    ))
    : false;

  const isFormValid = Boolean(resolvedBudget)
    && isAmountValid
    && isBudgetNameValid
    && isCategoryValid
    && !isDuplicateCategoryMonth;

  const budgetFormValidationLabel = showValidation && isDuplicateCategoryMonth
    ? "Ya existe un budget para esta categoría en el mes seleccionado."
    : null;

  const handleCreateCategory = useCallback(async (
    input: BudgetDetailCreateCategoryInput,
  ): Promise<BudgetDetailCategoryOption | null> => {
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
      icon: created.icon,
      iconBg: created.iconBg,
      name: created.name,
    };
  }, [createCategory]);

  const handleSubmitEdit = useCallback(async () => {
    setShowValidation(true);

    if (!resolvedBudget || !isFormValid || isEditorSubmitting) {
      return;
    }

    setIsEditorSubmitting(true);
    try {
      const updated = await update(resolvedBudget.id, {
        categoryId: normalizedSelectedCategoryId,
        name: normalizedBudgetName,
        limitAmount: limitAmountValue,
      });

      if (!updated) {
        return;
      }

      handleCloseEditor();
    } finally {
      setIsEditorSubmitting(false);
    }
  }, [
    handleCloseEditor,
    isEditorSubmitting,
    isFormValid,
    limitAmountValue,
    normalizedBudgetName,
    normalizedSelectedCategoryId,
    resolvedBudget,
    update,
  ]);

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
  const resolvedProgressTextColor = toTextToneClass(resolvedProgressColor);

  return {
    budgetFormValidationLabel,
    budgetNameInput,
    categoriesError,
    categoryColorOptions,
    categoryIconOptions,
    detailSubcategories,
    handleCloseEditor,
    handleCreateCategory,
    handleOpenEditor,
    handleSubmitEdit,
    isAmountValid,
    isBudgetNameValid,
    isCategoriesLoading,
    isCategoryValid,
    isDuplicateCategoryMonth,
    isEditorOpen,
    isEditorSubmitting,
    isEmpty,
    isFormValid,
    isLoading,
    limitAmountInput,
    resolvedBudgetDescription,
    resolvedBudgetIcon,
    resolvedBudgetName,
    resolvedHeaderBg,
    resolvedPercentBadgeText,
    resolvedProgressColor,
    resolvedProgressPercent,
    resolvedProgressRemainingLabel,
    resolvedProgressTextColor,
    resolvedProgressUsedLabel,
    resolvedSpentValue,
    selectedCategoryId,
    setBudgetNameInput,
    setLimitAmountInput,
    setSelectedCategoryId,
    showValidation,
    sortedCategories,
  };
};
