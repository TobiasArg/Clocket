import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrency } from "./useCurrency";
import { useAccounts } from "./useAccounts";
import { useGoals } from "./useGoals";
import { goalsRepository } from "@/utils";
import {
  formatCurrency,
  GOAL_COLOR_OPTIONS,
  GOAL_ICON_OPTIONS,
  convertCurrencyAmount,
  type TransactionInputCurrency,
} from "@/utils";
import { TRANSACTIONS_CHANGED_EVENT } from "@/domain/transactions/repository";
import type { GoalDetailItem } from "@/domain/goals/repository";
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

const dispatchTransactionsChanged = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
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
    refresh: refreshGoals,
    resolveDeletion,
    update: updateGoal,
  } = useGoals();
  const { items: accounts } = useAccounts();
  const [goalDetail, setGoalDetail] = useState<GoalDetailItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fallbackGoal = useMemo(
    () => goals.find((item) => item.id === goalId) ?? null,
    [goalId, goals],
  );
  const goal = goalDetail ?? fallbackGoal;

  const loadGoalDetail = useCallback(async () => {
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      setGoalDetail(await goalsRepository.getById(goalId, appCurrency));
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "We couldn't load this goal.");
    } finally {
      setIsDetailLoading(false);
    }
  }, [appCurrency, goalId]);

  useEffect(() => {
    void loadGoalDetail();
  }, [loadGoalDetail]);

  const savedAmount = goal?.savedAmount ?? 0;
  const targetAmount = goal?.targetAmount ?? 0;
  const progressPercent = goal?.progressPercent ?? 0;

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
    return [...(goalDetail?.entries ?? [])]
      .map((entry) => ({
        id: entry.id,
        amountLabel: formatCurrency(Math.abs(entry.amount), { currency: appCurrency }),
        date: formatEntryDate(entry.date),
        note: entry.name,
      }));
  }, [appCurrency, goalDetail]);

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

  const closeEdit = useCallback(() => {
    setIsEditSheetOpen(false);
    setShowEditValidation(false);
  }, []);

  const handleOpenEdit = useCallback(() => {
    if (!goal) {
      return;
    }

    const editCurrency = appCurrency;
    const displayTarget = goal.targetAmount;
    setTitleInput(goal.title);
    setDescriptionInput(goal.description);
    setTargetAmountInput(formatAmountInput(displayTarget));
    setSelectedCurrencyState(editCurrency);
    setDeadlineDateInput(goal.deadlineDate);
    setSelectedIcon(goal.icon);
    setSelectedColorKey(goal.colorKey);
    setShowEditValidation(false);
    setIsEditSheetOpen(true);
  }, [goal, appCurrency]);

  const handleCloseEdit = useCallback(() => {
    closeEdit();
  }, [closeEdit]);

  const setSelectedCurrency = useCallback((value: TransactionInputCurrency) => {
    if (value === selectedCurrency) {
      return;
    }

    const currentValue = Number(targetAmountInput);
    if (Number.isFinite(currentValue) && currentValue > 0) {
      const converted = convertCurrencyAmount(currentValue, selectedCurrency, value);
      setTargetAmountInput(formatAmountInput(converted));
    }

    setSelectedCurrencyState(value);
  }, [selectedCurrency, targetAmountInput]);

  const handleSaveEdit = useCallback(async (): Promise<void> => {
    if (!goal) {
      return;
    }

    setShowEditValidation(true);
    if (!isEditFormValid) {
      return;
    }

    const updated = await updateGoal(goal.id, {
      title: normalizedTitle,
      description: normalizedDescription,
      targetAmount: targetAmountValue,
      currency: selectedCurrency,
      deadlineDate: deadlineDateInput,
      icon: selectedIcon,
      colorKey: selectedColorKey,
    });

    if (!updated) {
      return;
    }

    await loadGoalDetail();
    dispatchTransactionsChanged();

    closeEdit();
  }, [
    goal,
    isEditFormValid,
    normalizedTitle,
    normalizedDescription,
    targetAmountValue,
    selectedCurrency,
    deadlineDateInput,
    selectedIcon,
    selectedColorKey,
    updateGoal,
    loadGoalDetail,
    closeEdit,
  ]);

  const handleDeleteGoal = useCallback(async (): Promise<boolean> => {
    if (!goal || !canConfirmDelete) {
      return false;
    }

    const result = await resolveDeletion(goal.id, deleteResolution === "delete_entries"
      ? { mode: "delete_entries" }
      : deleteResolution === "redirect_goal"
        ? { mode: "redirect_goal", targetGoalId: redirectGoalId }
        : { mode: "redirect_account", targetAccountId: redirectAccountId });
    if (!result?.deleted) {
      return false;
    }

    await refreshGoals();
    dispatchTransactionsChanged();
    setIsDeleteDialogOpen(false);
    return true;
  }, [
    goal,
    canConfirmDelete,
    deleteResolution,
    redirectGoalId,
    redirectAccountId,
    resolveDeletion,
    refreshGoals,
  ]);

  return {
    canConfirmDelete,
    colorOptions,
    deadlineDateInput,
    deleteResolution,
    descriptionInput,
    entries,
    error: goalsError ?? detailError,
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
    isLoading: isGoalsLoading || isDetailLoading,
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
