import { useCallback, useEffect, useMemo, useState } from "react";
import type { SubcategoryItem } from "@/types";
import { useBudgets } from "./useBudgets";
import { useCategories } from "./useCategories";
import { useCurrency } from "./useCurrency";
import { sanitizeScopeRulesForCategories } from "./useBudgetsPageModel";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  doBudgetScopeRulesOverlap,
  formatCurrency,
  getCategoryColorOption,
  getCurrentMonthWindow,
  getPrimaryBudgetCategoryId,
  normalizeBudgetScopeRules,
  resolveBudgetScopeRulesFromBudget,
  type BudgetScopeRule,
  type BudgetUsageDetailResult,
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

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
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
  const { currency: appCurrency } = useCurrency();

  const { items: budgets, isLoading: isBudgetsLoading, update, getUsageById } = useBudgets();
  const {
    items: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    create: createCategory,
  } = useCategories();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isEditorSubmitting, setIsEditorSubmitting] = useState<boolean>(false);
  const [selectedScopeRulesState, setSelectedScopeRulesState] = useState<BudgetScopeRule[]>([]);
  const [budgetNameInput, setBudgetNameInput] = useState<string>("");
  const [limitAmountInput, setLimitAmountInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [usageDetail, setUsageDetail] = useState<BudgetUsageDetailResult | null>(null);

  const currentMonthWindow = useMemo(() => getCurrentMonthWindow(), []);
  const currentMonth = useMemo(() => {
    const year = currentMonthWindow.start.getFullYear();
    const month = String(currentMonthWindow.start.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [currentMonthWindow]);

  const resolvedBudget = useMemo(() => {
    if (usageDetail) {
      return usageDetail.budget;
    }

    if (budgetId) {
      return budgets.find((budget) => budget.id === budgetId) ?? null;
    }

    return budgets.find((budget) => budget.month === currentMonth) ?? null;
  }, [budgetId, budgets, currentMonth, usageDetail]);

  useEffect(() => {
    const targetBudgetId = budgetId ?? resolvedBudget?.id;
    if (!targetBudgetId) {
      return;
    }

    let isActive = true;
    void (async () => {
      const result = await getUsageById(targetBudgetId, resolvedBudget?.month);
      if (isActive) {
        setUsageDetail(result);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [budgetId, getUsageById, resolvedBudget?.id, resolvedBudget?.month]);

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

  const resolvedScopeRules = useMemo(
    () => (resolvedBudget ? resolveBudgetScopeRulesFromBudget(resolvedBudget) : []),
    [resolvedBudget],
  );

  const spentAmount = usageDetail?.usage.spentAmount ?? 0;

  const primaryCategoryId = useMemo(
    () =>
      resolvedBudget
        ? getPrimaryBudgetCategoryId(resolvedScopeRules, resolvedBudget.categoryId)
        : null,
    [resolvedBudget, resolvedScopeRules],
  );

  const primaryCategoryMeta = primaryCategoryId
    ? (categoryById.get(primaryCategoryId) ?? null)
    : null;

  const categoryAccentColor = primaryCategoryMeta?.iconBg ?? "bg-[#DC2626]";
  const resolvedProgressColor = progressColor ?? categoryAccentColor;
  const resolvedHeaderBg = headerBg ?? categoryAccentColor;

  const detailSubcategories = useMemo<SubcategoryItem[]>(() => {
    if (subcategories) {
      return subcategories;
    }

    if (!usageDetail) {
      return [];
    }

    return usageDetail.groups.map((group) => {
      const categoryMeta = group.categoryId ? categoryById.get(group.categoryId) : undefined;
      const percent = clampPercent(group.percentageBasis);
      return {
        dotColor: categoryMeta?.iconBg ?? "bg-[#71717A]",
        name: group.label,
        amount: formatCurrency(group.amount, { currency: appCurrency }),
        percent: `${percent}%`,
        barColor: categoryMeta?.iconBg ?? "bg-[#71717A]",
        barWidthPercent: percent,
      };
    });
  }, [appCurrency, categoryById, subcategories, usageDetail]);

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
    ? budgets.some(
        (budget) =>
          budget.id !== resolvedBudget.id &&
          budget.month === resolvedBudget.month &&
          doBudgetScopeRulesOverlap(selectedScopeRules, resolveBudgetScopeRulesFromBudget(budget)),
      )
    : false;

  const isFormValid =
    Boolean(resolvedBudget) &&
    isAmountValid &&
    isBudgetNameValid &&
    isScopeValid &&
    !isDuplicateCategoryMonth;

  const budgetFormValidationLabel = hasInvalidScopeRules
    ? "El alcance tiene categorías/subcategorías inválidas. Revísalo antes de guardar."
    : showValidation && isDuplicateCategoryMonth
      ? "Ya existe un budget para parte del alcance seleccionado en el mes."
      : null;

  const handleCreateCategory = useCallback(
    async (input: BudgetDetailCreateCategoryInput): Promise<BudgetDetailCategoryOption | null> => {
      const normalizedName = input.name.trim();
      if (normalizedName.length === 0) {
        return null;
      }

      const normalizedIcon =
        input.icon.trim().length > 0 ? input.icon.trim() : DEFAULT_CATEGORY_ICON;
      const resolvedColorKey =
        CATEGORY_COLOR_OPTIONS.find((option) => option.key === input.colorKey)?.key ??
        DEFAULT_CATEGORY_COLOR_KEY;
      const iconBg = getCategoryColorOption(resolvedColorKey).iconBgClass;

      const created = await createCategory({
        name: normalizedName,
        icon: normalizedIcon,
        iconBg,
      });

      if (!created?.id) {
        return null;
      }

      setSelectedScopeRulesState((current) =>
        normalizeBudgetScopeRules([
          ...current,
          {
            categoryId: created.id,
            mode: "all_subcategories",
          },
        ]),
      );

      setBudgetNameInput((current) => (current.trim().length > 0 ? current : created.name));

      return {
        id: created.id,
        icon: created.icon,
        iconBg: created.iconBg,
        name: created.name,
        subcategories: normalizeSubcategories(created.subcategories),
      };
    },
    [createCategory],
  );

  const handleSubmitEdit = useCallback(async () => {
    setShowValidation(true);

    if (!resolvedBudget || !isFormValid || isEditorSubmitting) {
      return;
    }

    setIsEditorSubmitting(true);
    try {
      const updatedScopeRules = sanitizeScopeRulesForCategories(
        selectedScopeRules,
        sortedCategories,
      );
      if (updatedScopeRules.length === 0) {
        return;
      }

      const updated = await update(resolvedBudget.id, {
        categoryId:
          getPrimaryBudgetCategoryId(updatedScopeRules, resolvedBudget.categoryId) ?? undefined,
        scopeRules: updatedScopeRules,
        name: normalizedBudgetName,
        limitAmount: limitAmountValue,
      });

      if (!updated) {
        return;
      }

      setUsageDetail(await getUsageById(updated.id, updated.month));

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
    getUsageById,
    update,
  ]);

  const isLoading = isBudgetsLoading && !resolvedBudget;
  const isEmpty = !resolvedBudget;

  const budgetLimit = usageDetail
    ? usageDetail.usage.spentAmount + usageDetail.usage.remainingAmount - usageDetail.usage.overspentAmount
    : (resolvedBudget?.limitAmount ?? 0);
  const resolvedProgressPercent =
    progressPercent ?? usageDetail?.usage.clampedProgress ?? (budgetLimit > 0 ? clampPercent((spentAmount / budgetLimit) * 100) : 0);
  const remaining = usageDetail?.usage.remainingAmount ?? Math.max(0, budgetLimit - spentAmount);

  const resolvedBudgetName = budgetName ?? resolvedBudget?.name ?? "";
  const resolvedBudgetIcon = budgetIcon ?? primaryCategoryMeta?.icon ?? "tag";
  const resolvedBudgetDescription = budgetDescription ?? "Seguimiento mensual";
  const resolvedSpentValue =
    spentValue ?? `${formatCurrency(spentAmount, { currency: appCurrency })} / ${formatCurrency(budgetLimit, { currency: appCurrency })}`;
  const resolvedPercentBadgeText = percentBadgeText ?? `${resolvedProgressPercent}% del budget`;
  const resolvedProgressUsedLabel = progressUsedLabel ?? `${resolvedProgressPercent}% usado`;
  const resolvedProgressRemainingLabel =
    progressRemainingLabel ?? `${formatCurrency(remaining, { currency: appCurrency })} restante`;
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
