import { useMemo, useState } from "react";
import { useCurrency } from "./useCurrency";
import { useAccounts } from "./useAccounts";
import { useCategories } from "./useCategories";
import { useGoals } from "./useGoals";
import { useTransactions } from "./useTransactions";
import {
  formatCurrency,
  getGoalCategoryName,
  getGoalColorOption,
  GOAL_COLOR_OPTIONS,
  GOAL_ICON_OPTIONS,
  toArsTransactionAmount,
  getUsdRate,
  type TransactionInputCurrency,
} from "@/utils";
import type { GoalColorKey } from "@/types";

export type GoalDeleteResolution = "redirect_goal" | "redirect_account" | "delete_entries";

export interface GoalEntryPresentation {
  id: string;
  amountLabel: string;
  date: string;
  note: string;
}

export interface UseGoalDetailPageModelOptions {
  goalId: string;
}

export interface UseGoalDetailPageModelResult {
  canConfirmDelete: boolean;
  colorOptions: Array<{ key: GoalColorKey; label: string; swatchClass: string }>;
  deadlineDateInput: string;
  deleteResolution: GoalDeleteResolution;
  descriptionInput: string;
  entries: GoalEntryPresentation[];
  error: string | null;
  goal: ReturnType<typeof useGoals>["items"][number] | null;
  handleCloseEdit: () => void;
  handleDeleteGoal: () => Promise<boolean>;
  handleOpenEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  iconOptions: string[];
  isDeadlineValid: boolean;
  isDeleteDialogOpen: boolean;
  isDescriptionValid: boolean;
  isEditFormValid: boolean;
  isEditSheetOpen: boolean;
  isLoading: boolean;
  isTargetValid: boolean;
  isTitleValid: boolean;
  progressPercent: number;
  redirectAccountId: string;
  redirectGoalId: string;
  savedAmount: number;
  selectedColorKey: GoalColorKey;
  selectedCurrency: TransactionInputCurrency;
  selectedIcon: string;
  setDeadlineDateInput: (value: string) => void;
  setDeleteResolution: (value: GoalDeleteResolution) => void;
  setDescriptionInput: (value: string) => void;
  setIsDeleteDialogOpen: (value: boolean) => void;
  setRedirectAccountId: (value: string) => void;
  setRedirectGoalId: (value: string) => void;
  setSelectedColorKey: (value: GoalColorKey) => void;
  setSelectedCurrency: (value: TransactionInputCurrency) => void;
  setSelectedIcon: (value: string) => void;
  setTargetAmountInput: (value: string) => void;
  setTitleInput: (value: string) => void;
  showEditValidation: boolean;
  targetAmount: number;
  targetAmountInput: string;
  titleInput: string;
  visibleAccounts: ReturnType<typeof useAccounts>["items"];
  visibleGoalsForRedirect: ReturnType<typeof useGoals>["items"];
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatEntryDate = (value: string): string => {
  if (!ISO_DATE_PATTERN.test(value)) {
    return value;
  }

  const [year, month, day] = value.split("-");
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(Number(year), Number(month) - 1, Number(day)));
};

const formatAmountInput = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  const rounded = Math.round(value * 100) / 100;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
};

const convertArsToCurrency = (amountArs: number, currency: TransactionInputCurrency): number => {
  if (!Number.isFinite(amountArs) || amountArs <= 0) {
    return 0;
  }

  if (currency === "USD") {
    const rate = getUsdRate();
    if (!Number.isFinite(rate) || rate <= 0) {
      return amountArs;
    }

    return amountArs / rate;
  }

  return amountArs;
};

const ensureUncategorizedCategory = async (
  categories: ReturnType<typeof useCategories>["items"],
  createCategory: ReturnType<typeof useCategories>["create"],
): Promise<{ id: string; name: string } | null> => {
  const existing = categories.find((category) => (
    category.name.trim().toLocaleLowerCase("es-ES") === "sin categoría" ||
    category.name.trim().toLocaleLowerCase("es-ES") === "sin categoria"
  ));
  if (existing) {
    return { id: existing.id, name: existing.name };
  }

  const created = await createCategory({
    name: "Sin categoría",
    icon: "tag",
    iconBg: "bg-[#71717A]",
  });

  return created ? { id: created.id, name: created.name } : null;
};

export const useGoalDetailPageModel = (
  options: UseGoalDetailPageModelOptions,
): UseGoalDetailPageModelResult => {
  const { goalId } = options;
  const { currency: appCurrency } = useCurrency();
  const {
    items: goals,
    isLoading: isGoalsLoading,
    error: goalsError,
    remove: removeGoal,
    update: updateGoal,
  } = useGoals();
  const { items: accounts } = useAccounts();
  const { items: categories, create: createCategory } = useCategories();
  const {
    items: transactions,
    isLoading: isTransactionsLoading,
    update: updateTransaction,
    remove: removeTransaction,
  } = useTransactions();

  const goal = useMemo(
    () => goals.find((item) => item.id === goalId) ?? null,
    [goalId, goals],
  );
  const goalEntries = useMemo(
    () => transactions.filter((transaction) => transaction.goalId === goalId),
    [goalId, transactions],
  );

  const savedAmount = useMemo(
    () => goalEntries.reduce((sum, entry) => {
      const amount = parseSignedAmount(entry.amount);
      return amount < 0 ? sum + Math.abs(amount) : sum;
    }, 0),
    [goalEntries],
  );
  const targetAmount = goal?.targetAmount ?? 0;
  const progressPercent = targetAmount > 0
    ? Math.max(0, Math.min(100, Math.round((savedAmount / targetAmount) * 100)))
    : 0;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deleteResolution, setDeleteResolution] = useState<GoalDeleteResolution>("delete_entries");
  const [redirectGoalId, setRedirectGoalId] = useState<string>("");
  const [redirectAccountId, setRedirectAccountId] = useState<string>("");

  const [isEditSheetOpen, setIsEditSheetOpen] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>("");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [targetAmountInput, setTargetAmountInput] = useState<string>("");
  const [selectedCurrency, setSelectedCurrencyState] = useState<TransactionInputCurrency>(appCurrency);
  const [deadlineDateInput, setDeadlineDateInput] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<string>(GOAL_ICON_OPTIONS[0] ?? "target");
  const [selectedColorKey, setSelectedColorKey] = useState<GoalColorKey>("emerald");
  const [showEditValidation, setShowEditValidation] = useState<boolean>(false);

  const normalizedTitle = titleInput.trim();
  const normalizedDescription = descriptionInput.trim();
  const targetAmountValue = Number(targetAmountInput);

  const isTitleValid = normalizedTitle.length > 0;
  const isDescriptionValid = normalizedDescription.length > 0;
  const isTargetValid = Number.isFinite(targetAmountValue) && targetAmountValue > 0;
  const isDeadlineValid = ISO_DATE_PATTERN.test(deadlineDateInput);
  const isEditFormValid = isTitleValid && isDescriptionValid && isTargetValid && isDeadlineValid;

  const canConfirmDelete = (
    (deleteResolution === "delete_entries") ||
    (deleteResolution === "redirect_goal" && redirectGoalId.trim().length > 0) ||
    (deleteResolution === "redirect_account" && redirectAccountId.trim().length > 0)
  );

  const entries = useMemo<GoalEntryPresentation[]>(() => {
    return [...goalEntries]
      .sort((left, right) => right.date.localeCompare(left.date))
      .map((entry) => ({
        id: entry.id,
        amountLabel: formatCurrency(Math.abs(parseSignedAmount(entry.amount))),
        date: formatEntryDate(entry.date),
        note: entry.name,
      }));
  }, [goalEntries]);

  const visibleGoalsForRedirect = useMemo(
    () => goals.filter((item) => item.id !== goalId),
    [goalId, goals],
  );

  const colorOptions = useMemo(
    () => GOAL_COLOR_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      swatchClass: option.iconBgClass,
    })),
    [],
  );

  const closeEdit = () => {
    setIsEditSheetOpen(false);
    setShowEditValidation(false);
  };

  const handleOpenEdit = () => {
    if (!goal) {
      return;
    }

    const editCurrency = appCurrency;
    const displayTarget = convertArsToCurrency(goal.targetAmount, editCurrency);
    setTitleInput(goal.title);
    setDescriptionInput(goal.description);
    setTargetAmountInput(formatAmountInput(displayTarget));
    setSelectedCurrencyState(editCurrency);
    setDeadlineDateInput(goal.deadlineDate);
    setSelectedIcon(goal.icon);
    setSelectedColorKey(goal.colorKey);
    setShowEditValidation(false);
    setIsEditSheetOpen(true);
  };

  const handleCloseEdit = () => {
    closeEdit();
  };

  const setSelectedCurrency = (value: TransactionInputCurrency) => {
    if (value === selectedCurrency) {
      return;
    }

    const currentValue = Number(targetAmountInput);
    if (Number.isFinite(currentValue) && currentValue > 0) {
      const amountInArs = toArsTransactionAmount(currentValue, selectedCurrency);
      const converted = convertArsToCurrency(amountInArs, value);
      setTargetAmountInput(formatAmountInput(converted));
    }

    setSelectedCurrencyState(value);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!goal) {
      return;
    }

    setShowEditValidation(true);
    if (!isEditFormValid) {
      return;
    }

    const normalizedTargetAmount = toArsTransactionAmount(targetAmountValue, selectedCurrency);
    const updated = await updateGoal(goal.id, {
      title: normalizedTitle,
      description: normalizedDescription,
      targetAmount: normalizedTargetAmount,
      deadlineDate: deadlineDateInput,
      icon: selectedIcon,
      colorKey: selectedColorKey,
    });

    if (!updated) {
      return;
    }

    const updatedColor = getGoalColorOption(updated.colorKey);
    for (const entry of goalEntries) {
      await updateTransaction(entry.id, {
        goalId: updated.id,
        categoryId: updated.categoryId,
        category: getGoalCategoryName(updated.title),
        subcategoryName: updated.title,
        transactionType: "saving",
        icon: updated.icon,
        iconBg: updatedColor.iconBgClass,
      });
    }

    closeEdit();
  };

  const handleDeleteGoal = async (): Promise<boolean> => {
    if (!goal || !canConfirmDelete) {
      return false;
    }

    if (deleteResolution === "redirect_goal") {
      const targetGoal = goals.find((item) => item.id === redirectGoalId);
      if (!targetGoal) {
        return false;
      }

      for (const entry of goalEntries) {
        const redirectColor = getGoalColorOption(targetGoal.colorKey);
        await updateTransaction(entry.id, {
          goalId: targetGoal.id,
          categoryId: targetGoal.categoryId,
          category: getGoalCategoryName(targetGoal.title),
          subcategoryName: targetGoal.title,
          transactionType: "saving",
          icon: targetGoal.icon,
          iconBg: redirectColor.iconBgClass,
        });
      }
    }

    if (deleteResolution === "redirect_account") {
      const fallbackCategory = await ensureUncategorizedCategory(categories, createCategory);
      if (!fallbackCategory) {
        return false;
      }

      for (const entry of goalEntries) {
        await updateTransaction(entry.id, {
          accountId: redirectAccountId,
          categoryId: fallbackCategory.id,
          category: fallbackCategory.name,
          subcategoryName: undefined,
          transactionType: "regular",
          goalId: undefined,
        });
      }
    }

    if (deleteResolution === "delete_entries") {
      for (const entry of goalEntries) {
        await removeTransaction(entry.id);
      }
    }

    const removed = await removeGoal(goal.id);
    if (!removed) {
      return false;
    }

    setIsDeleteDialogOpen(false);
    return true;
  };

  return {
    canConfirmDelete,
    colorOptions,
    deadlineDateInput,
    deleteResolution,
    descriptionInput,
    entries,
    error: goalsError,
    goal,
    handleCloseEdit,
    handleDeleteGoal,
    handleOpenEdit,
    handleSaveEdit,
    iconOptions: GOAL_ICON_OPTIONS,
    isDeadlineValid,
    isDeleteDialogOpen,
    isDescriptionValid,
    isEditFormValid,
    isEditSheetOpen,
    isLoading: isGoalsLoading || isTransactionsLoading,
    isTargetValid,
    isTitleValid,
    progressPercent,
    redirectAccountId,
    redirectGoalId,
    savedAmount,
    selectedColorKey,
    selectedCurrency,
    selectedIcon,
    setDeadlineDateInput,
    setDeleteResolution,
    setDescriptionInput,
    setIsDeleteDialogOpen,
    setRedirectAccountId,
    setRedirectGoalId,
    setSelectedColorKey,
    setSelectedCurrency,
    setSelectedIcon,
    setTargetAmountInput,
    setTitleInput,
    showEditValidation,
    targetAmount,
    targetAmountInput,
    titleInput,
    visibleAccounts: accounts,
    visibleGoalsForRedirect,
  };
};
