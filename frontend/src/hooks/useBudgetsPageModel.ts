import { useCallback, useEffect, useMemo, useState } from "react";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import {
  BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN,
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  doBudgetScopeRulesOverlap,
  getCategoryColorOption,
  getPrimaryBudgetCategoryId,
  normalizeBudgetScopeRules,
  resolveBudgetScopeRulesFromBudget,
  type BudgetPlanItem,
  type BudgetScopeRule,
  type BudgetUsageListResult,
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

const emptySummary: BudgetsSummary = {
  overspentAmount: 0,
  progress: 0,
  rawProgress: 0,
  totalBudget: 0,
  totalSpent: 0,
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
    listUsage,
  } = useBudgets();
  const {
    items: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    create: createCategory,
  } = useCategories();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedScopeRulesState, setSelectedScopeRulesState] = useState<BudgetScopeRule[]>([]);
  const [budgetNameInput, setBudgetNameInput] = useState<string>("");
  const [limitAmountInput, setLimitAmountInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    buildYearMonth(new Date()),
  );
  const [budgetUsage, setBudgetUsage] = useState<BudgetUsageListResult | null>(null);

  const selectedMonthLabel = useMemo(
    () => formatYearMonthLabel(selectedMonth),
    [selectedMonth],
  );

  useEffect(() => {
    let isActive = true;
    void (async () => {
      const usage = await listUsage(selectedMonth);
      if (isActive) {
        setBudgetUsage(usage);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [listUsage, selectedMonth]);

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
    () => budgetUsage?.budgets.map((item) => item.budget) ?? budgets.filter((budget) => budget.month === selectedMonth),
    [budgetUsage, budgets, selectedMonth],
  );

  const expensesByBudgetId = useMemo(
    () => new Map(
      (budgetUsage?.budgets ?? visibleBudgets.map((budget) => ({ budget, spentAmount: 0 })))
        .map((item) => [item.budget.id, item.spentAmount] as const),
    ),
    [budgetUsage, visibleBudgets],
  );

  const summary = useMemo<BudgetsSummary>(() => budgetUsage
    ? {
        overspentAmount: budgetUsage.summary.overspentAmount,
        totalBudget: budgetUsage.summary.totalLimitAmount,
        totalSpent: budgetUsage.summary.totalSpentAmount,
        progress: budgetUsage.summary.clampedProgress,
        rawProgress: budgetUsage.summary.rawProgress,
      }
    : emptySummary,
  [budgetUsage]);

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

  const resetEditor = useCallback(() => {
    setSelectedScopeRulesState([]);
    setBudgetNameInput("");
    setLimitAmountInput("");
    setShowValidation(false);
  }, []);

  const handleOpenEditor = useCallback(() => {
    setIsEditorOpen(true);
    setShowValidation(false);
    onAddClick?.();
  }, [onAddClick]);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    resetEditor();
  }, [resetEditor]);

  const handlePreviousMonth = useCallback(() => {
    setSelectedMonth((current) => shiftYearMonth(current, -1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((current) => shiftYearMonth(current, 1));
  }, []);

  const handleHeaderAction = useCallback(() => {
    if (isEditorOpen) {
      handleCloseEditor();
      onAddClick?.();
    } else {
      handleOpenEditor();
    }
  }, [isEditorOpen, handleCloseEditor, handleOpenEditor, onAddClick]);

  const handleCreateCategory = useCallback(async (
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
  }, [createCategory]);

  const handleCreate = useCallback(async () => {
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
    setBudgetUsage(await listUsage(selectedMonth));
  }, [
    isFormValid,
    selectedScopeRules,
    sortedCategories,
    normalizedBudgetName,
    limitAmountValue,
    selectedMonth,
    create,
    listUsage,
    resetEditor,
  ]);

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
