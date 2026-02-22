import { useCallback, useMemo, useState } from "react";
import type { SubcategoryItem } from "@/types";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import { sanitizeScopeRulesForCategories } from "./useBudgetsPageModel";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  doBudgetScopeRulesOverlap,
  doesBudgetScopeMatchTransaction,
  formatCurrency,
  getCategoryColorOption,
  getCurrentMonthWindow,
  getPrimaryBudgetCategoryId,
  getTransactionDateForMonthBalance,
  normalizeBudgetScopeRules,
  resolveBudgetScopeRulesFromBudget,
  type BudgetScopeRule,
  type TransactionItem,
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
  subcategories: string[];
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

export interface BudgetDetailCategoryMeta {
  iconBg: string;
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
  isDuplicateCategoryMonth: boolean;
  isEditorOpen: boolean;
  isEditorSubmitting: boolean;
  isEmpty: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isScopeValid: boolean;
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
  selectedScopeRules: BudgetScopeRule[];
  setBudgetNameInput: (value: string) => void;
  setLimitAmountInput: (value: string) => void;
  setSelectedScopeRules: (value: BudgetScopeRule[]) => void;
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

const normalizeSubcategories = (subcategories: string[] | undefined): string[] => {
  if (!Array.isArray(subcategories)) {
    return [];
  }

  const unique = new Set<string>();
  subcategories.forEach((subcategory) => {
    const normalized = subcategory.trim();
    if (normalized.length === 0) {
      return;
    }

    unique.add(normalized);
  });

  return Array.from(unique);
};

export const buildBudgetDetailSubcategoryItems = ({
  categoryById,
  monthWindow,
  scopeRules,
  transactions,
  legacyCategoryId,
}: {
  categoryById: Map<string, BudgetDetailCategoryMeta>;
  monthWindow: { start: Date; end: Date };
  scopeRules: BudgetScopeRule[];
  transactions: TransactionItem[];
  legacyCategoryId?: string;
}): SubcategoryItem[] => {
  const grouped = new Map<string, { amount: number; color: string }>();

  transactions.forEach((transaction) => {
    const transactionDate = getTransactionDateForMonthBalance(transaction);
    if (!transactionDate) {
      return;
    }

    if (transactionDate < monthWindow.start || transactionDate >= monthWindow.end) {
      return;
    }

    if (!doesBudgetScopeMatchTransaction(scopeRules, transaction, legacyCategoryId)) {
      return;
    }

    const amount = parseSignedAmount(transaction.amount);
    if (amount >= 0) {
      return;
    }

    const categoryId = transaction.categoryId?.trim() ?? "";
    const categoryMeta = categoryId ? categoryById.get(categoryId) : null;
    const categoryName = categoryMeta?.name ?? transaction.category ?? "Categoría";
    const subcategoryName = transaction.subcategoryName?.trim().length
      ? transaction.subcategoryName.trim()
      : "Sin subcategoría";
    const key = `${categoryName} · ${subcategoryName}`;

    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        amount: Math.abs(amount),
        color: categoryMeta?.iconBg ?? "bg-[#71717A]",
      });
      return;
    }

    current.amount += Math.abs(amount);
    grouped.set(key, current);
  });

  const sorted = Array.from(grouped.entries())
    .sort((left, right) => right[1].amount - left[1].amount);

  const total = sorted.reduce((sum, entry) => sum + entry[1].amount, 0);
  if (total <= 0) {
    return [];
  }

  return sorted.map(([name, detail]) => {
    const percent = clampPercent((detail.amount / total) * 100);

    return {
      dotColor: detail.color,
      name,
      amount: formatCurrency(detail.amount),
      percent: `${percent}%`,
      barColor: detail.color,
      barWidthPercent: percent,
    };
  });
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
  const [selectedScopeRulesState, setSelectedScopeRulesState] = useState<BudgetScopeRule[]>([]);
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
        subcategories: normalizeSubcategories(category.subcategories),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [categories]);

  const categoryById = useMemo(() => {
    const map = new Map<string, BudgetDetailCategoryOption>();
    sortedCategories.forEach((category) => {
      map.set(category.id, category);
    });
    return map;
  }, [sortedCategories]);

  const selectedMonthWindow = useMemo(
    () => resolveMonthWindow(resolvedBudget?.month, currentMonthWindow),
    [currentMonthWindow, resolvedBudget?.month],
  );

  const resolvedScopeRules = useMemo(
    () => resolvedBudget ? resolveBudgetScopeRulesFromBudget(resolvedBudget) : [],
    [resolvedBudget],
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

      if (!doesBudgetScopeMatchTransaction(resolvedScopeRules, transaction, resolvedBudget.categoryId)) {
        return sum;
      }

      const amount = parseSignedAmount(transaction.amount);
      return amount < 0 ? sum + Math.abs(amount) : sum;
    }, 0);
  }, [resolvedBudget, resolvedScopeRules, selectedMonthWindow.end, selectedMonthWindow.start, transactions]);

  const primaryCategoryId = useMemo(
    () => resolvedBudget
      ? getPrimaryBudgetCategoryId(resolvedScopeRules, resolvedBudget.categoryId)
      : null,
    [resolvedBudget, resolvedScopeRules],
  );

  const primaryCategoryMeta = primaryCategoryId
    ? categoryById.get(primaryCategoryId) ?? null
    : null;

  const categoryAccentColor = primaryCategoryMeta?.iconBg ?? "bg-[#DC2626]";
  const resolvedProgressColor = progressColor ?? categoryAccentColor;
  const resolvedHeaderBg = headerBg ?? categoryAccentColor;

  const detailSubcategories = useMemo<SubcategoryItem[]>(() => {
    if (subcategories) {
      return subcategories;
    }

    if (!resolvedBudget) {
      return [];
    }

    return buildBudgetDetailSubcategoryItems({
      categoryById,
      monthWindow: selectedMonthWindow,
      scopeRules: resolvedScopeRules,
      transactions,
      legacyCategoryId: resolvedBudget.categoryId,
    });
  }, [
    categoryById,
    resolvedBudget,
    resolvedScopeRules,
    selectedMonthWindow.end,
    selectedMonthWindow.start,
    subcategories,
    transactions,
  ]);

  const normalizedSelectedScopeRules = useMemo(
    () => normalizeBudgetScopeRules(selectedScopeRulesState),
    [selectedScopeRulesState],
  );

  const selectedScopeRules = useMemo(
    () => sanitizeScopeRulesForCategories(normalizedSelectedScopeRules, sortedCategories),
    [normalizedSelectedScopeRules, sortedCategories],
  );

  const hasInvalidScopeRules = normalizedSelectedScopeRules.length !== selectedScopeRules.length;

  const resetEditor = useCallback(() => {
    setSelectedScopeRulesState([]);
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
    setSelectedScopeRulesState(resolveBudgetScopeRulesFromBudget(resolvedBudget));
    setBudgetNameInput(resolvedBudget.name);
    setLimitAmountInput(String(resolvedBudget.limitAmount));
    setShowValidation(false);
  }, [resolvedBudget]);

  const setSelectedScopeRules = useCallback((value: BudgetScopeRule[]) => {
    setSelectedScopeRulesState(normalizeBudgetScopeRules(value));
  }, []);

  const normalizedBudgetName = budgetNameInput.trim();
  const limitAmountValue = Number(limitAmountInput);

  const isAmountValid = Number.isFinite(limitAmountValue) && limitAmountValue > 0;
  const isBudgetNameValid = normalizedBudgetName.length > 0;
  const isScopeValid = selectedScopeRules.length > 0 && !hasInvalidScopeRules;

  const isDuplicateCategoryMonth = resolvedBudget
    ? budgets.some((budget) => (
      budget.id !== resolvedBudget.id
      && budget.month === resolvedBudget.month
      && doBudgetScopeRulesOverlap(selectedScopeRules, resolveBudgetScopeRulesFromBudget(budget))
    ))
    : false;

  const isFormValid = Boolean(resolvedBudget)
    && isAmountValid
    && isBudgetNameValid
    && isScopeValid
    && !isDuplicateCategoryMonth;

  const budgetFormValidationLabel = hasInvalidScopeRules
    ? "El alcance tiene categorías/subcategorías inválidas. Revísalo antes de guardar."
    : showValidation && isDuplicateCategoryMonth
      ? "Ya existe un budget para parte del alcance seleccionado en el mes."
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

    setSelectedScopeRulesState((current) => normalizeBudgetScopeRules([
      ...current,
      {
        categoryId: created.id,
        mode: "all_subcategories",
      },
    ]));

    setBudgetNameInput((current) => current.trim().length > 0 ? current : created.name);

    return {
      id: created.id,
      icon: created.icon,
      iconBg: created.iconBg,
      name: created.name,
      subcategories: normalizeSubcategories(created.subcategories),
    };
  }, [createCategory]);

  const handleSubmitEdit = useCallback(async () => {
    setShowValidation(true);

    if (!resolvedBudget || !isFormValid || isEditorSubmitting) {
      return;
    }

    setIsEditorSubmitting(true);
    try {
      const updatedScopeRules = sanitizeScopeRulesForCategories(selectedScopeRules, sortedCategories);
      if (updatedScopeRules.length === 0) {
        return;
      }

      const updated = await update(resolvedBudget.id, {
        categoryId: getPrimaryBudgetCategoryId(updatedScopeRules, resolvedBudget.categoryId) ?? undefined,
        scopeRules: updatedScopeRules,
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
    resolvedBudget,
    selectedScopeRules,
    sortedCategories,
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
  const resolvedBudgetIcon = budgetIcon ?? primaryCategoryMeta?.icon ?? "tag";
  const resolvedBudgetDescription = budgetDescription ?? "Seguimiento mensual";
  const resolvedSpentValue =
    spentValue ?? `${formatCurrency(spentAmount)} / ${formatCurrency(budgetLimit)}`;
  const resolvedPercentBadgeText = percentBadgeText ?? `${resolvedProgressPercent}% del budget`;
  const resolvedProgressUsedLabel = progressUsedLabel ?? `${resolvedProgressPercent}% usado`;
  const resolvedProgressRemainingLabel =
    progressRemainingLabel ?? `${formatCurrency(remaining)} restante`;
  const resolvedProgressTextColor = toTextToneClass(resolvedProgressColor);

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
    isDuplicateCategoryMonth,
    isEditorOpen,
    isEditorSubmitting,
    isEmpty,
    isFormValid,
    isLoading,
    isScopeValid,
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
    selectedScopeRules,
    setBudgetNameInput,
    setLimitAmountInput,
    setSelectedScopeRules,
    showValidation,
    sortedCategories,
  };
};
