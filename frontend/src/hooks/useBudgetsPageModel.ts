import { useCallback, useMemo, useState } from "react";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import {
  BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN,
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  doBudgetScopeRulesOverlap,
  doesBudgetScopeMatchTransaction,
  getCategoryColorOption,
  getPrimaryBudgetCategoryId,
  getTransactionDateForMonthBalance,
  normalizeBudgetScopeRules,
  resolveBudgetScopeRulesFromBudget,
  type BudgetPlanItem,
  type BudgetScopeRule,
  type TransactionItem,
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
  subcategories: string[];
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
  expensesByBudgetId: Map<string, number>;
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
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isScopeValid: boolean;
  limitAmountInput: string;
  selectedMonth: string;
  selectedMonthLabel: string;
  selectedScopeRules: BudgetScopeRule[];
  setBudgetNameInput: (value: string) => void;
  setLimitAmountInput: (value: string) => void;
  setSelectedScopeRules: (value: BudgetScopeRule[]) => void;
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

export const sanitizeScopeRulesForCategories = (
  scopeRules: BudgetScopeRule[],
  categoryOptions: BudgetCategoryOption[],
): BudgetScopeRule[] => {
  const categoryById = new Map<string, BudgetCategoryOption>();
  categoryOptions.forEach((category) => {
    categoryById.set(category.id, category);
  });

  const normalizedRules = normalizeBudgetScopeRules(scopeRules);
  const nextRules: BudgetScopeRule[] = [];

  normalizedRules.forEach((rule) => {
    const category = categoryById.get(rule.categoryId);
    if (!category) {
      return;
    }

    if (rule.mode === "all_subcategories") {
      nextRules.push({
        categoryId: rule.categoryId,
        mode: "all_subcategories",
      });
      return;
    }

    const allowedSubcategories = new Set<string>([
      ...normalizeSubcategories(category.subcategories),
      BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN,
    ]);
    const selectedSubcategories = (rule.subcategoryNames ?? [])
      .map((subcategory) => subcategory.trim())
      .filter((subcategory) => subcategory.length > 0)
      .filter((subcategory) => allowedSubcategories.has(subcategory));

    if (selectedSubcategories.length === 0) {
      return;
    }

    nextRules.push({
      categoryId: rule.categoryId,
      mode: "selected_subcategories",
      subcategoryNames: Array.from(new Set(selectedSubcategories)),
    });
  });

  return normalizeBudgetScopeRules(nextRules);
};

export const buildBudgetExpensesById = (
  budgets: BudgetPlanItem[],
  transactions: TransactionItem[],
  monthWindow: { start: Date; end: Date },
): Map<string, number> => {
  const map = new Map<string, number>();
  budgets.forEach((budget) => {
    map.set(budget.id, 0);
  });

  if (budgets.length === 0 || transactions.length === 0) {
    return map;
  }

  const visibleTransactions = transactions.filter((transaction) => {
    const transactionDate = getTransactionDateForMonthBalance(transaction);
    if (!transactionDate) {
      return false;
    }

    if (transactionDate < monthWindow.start || transactionDate >= monthWindow.end) {
      return false;
    }

    return parseSignedAmount(transaction.amount) < 0;
  });

  if (visibleTransactions.length === 0) {
    return map;
  }

  budgets.forEach((budget) => {
    const scopeRules = resolveBudgetScopeRulesFromBudget(budget);
    if (scopeRules.length === 0) {
      return;
    }

    let spentAmount = 0;
    visibleTransactions.forEach((transaction) => {
      if (!doesBudgetScopeMatchTransaction(scopeRules, transaction)) {
        return;
      }

      spentAmount += Math.abs(parseSignedAmount(transaction.amount));
    });

    map.set(budget.id, spentAmount);
  });

  return map;
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
  const [selectedScopeRulesState, setSelectedScopeRulesState] = useState<BudgetScopeRule[]>([]);
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

  const sortedCategories = useMemo<BudgetCategoryOption[]>(
    () => categories
      .filter((category) => Boolean(category.id))
      .map((category) => ({
        id: category.id as string,
        icon: category.icon,
        iconBg: category.iconBg,
        name: category.name,
        subcategories: normalizeSubcategories(category.subcategories),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    [categories],
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, BudgetCategoryMeta>();
    sortedCategories.forEach((category) => {
      map.set(category.id, {
        name: category.name,
        icon: category.icon,
        iconBg: category.iconBg,
      });
    });
    return map;
  }, [sortedCategories]);

  const selectedScopeRules = useMemo(
    () => sanitizeScopeRulesForCategories(selectedScopeRulesState, sortedCategories),
    [selectedScopeRulesState, sortedCategories],
  );

  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === selectedMonth),
    [budgets, selectedMonth],
  );

  const expensesByBudgetId = useMemo(
    () => buildBudgetExpensesById(visibleBudgets, transactions, selectedMonthWindow),
    [selectedMonthWindow, transactions, visibleBudgets],
  );

  const summary = useMemo<BudgetsSummary>(() => {
    const totalBudget = visibleBudgets.reduce((sum, item) => sum + item.limitAmount, 0);
    const totalSpent = visibleBudgets.reduce(
      (sum, item) => sum + (expensesByBudgetId.get(item.id) ?? 0),
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
  }, [expensesByBudgetId, visibleBudgets]);

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

  const setSelectedScopeRules = useCallback((value: BudgetScopeRule[]) => {
    setSelectedScopeRulesState(normalizeBudgetScopeRules(value));
  }, []);

  const limitAmountValue = Number(limitAmountInput);
  const normalizedBudgetName = budgetNameInput.trim();
  const isAmountValid = Number.isFinite(limitAmountValue) && limitAmountValue > 0;
  const isBudgetNameValid = normalizedBudgetName.length > 0;
  const isScopeValid = selectedScopeRules.length > 0;

  const isDuplicateCategoryMonth = selectedScopeRules.length > 0
    && visibleBudgets.some((budget) => {
      const budgetScopeRules = resolveBudgetScopeRulesFromBudget(budget);
      return doBudgetScopeRulesOverlap(selectedScopeRules, budgetScopeRules);
    });

  const isFormValid = isAmountValid && isBudgetNameValid && isScopeValid && !isDuplicateCategoryMonth;
  const budgetFormValidationLabel = showValidation && isDuplicateCategoryMonth
    ? "Ya existe un budget para el alcance seleccionado en este mes."
    : null;

  const resetEditor = () => {
    setSelectedScopeRulesState([]);
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
      name: created.name,
      icon: created.icon,
      iconBg: created.iconBg,
      subcategories: normalizeSubcategories(created.subcategories),
    };
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const scopeRules = sanitizeScopeRulesForCategories(selectedScopeRules, sortedCategories);
    if (scopeRules.length === 0) {
      return;
    }

    const created = await create({
      categoryId: getPrimaryBudgetCategoryId(scopeRules) ?? undefined,
      scopeRules,
      name: normalizedBudgetName || "Uncategorized",
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
    expensesByBudgetId,
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
    isEditorOpen,
    isFormValid,
    isLoading: isBudgetsLoading,
    isScopeValid,
    limitAmountInput,
    selectedMonth,
    selectedMonthLabel,
    selectedScopeRules,
    setBudgetNameInput,
    setLimitAmountInput,
    setSelectedScopeRules,
    showValidation,
    sortedCategories,
    summary,
    visibleBudgets,
  };
};
