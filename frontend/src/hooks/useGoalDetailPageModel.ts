import { useMemo, useState } from "react";
import { useAccounts } from "./useAccounts";
import { useCategories } from "./useCategories";
import { useGoals } from "./useGoals";
import { useTransactions } from "./useTransactions";
import {
  formatCurrency,
  getGoalCategoryName,
  getGoalColorOption,
  toArsTransactionAmount,
  type TransactionInputCurrency,
} from "@/utils";

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
  deleteResolution: GoalDeleteResolution;
  entryAmountInput: string;
  entryDateInput: string;
  entryNoteInput: string;
  entries: GoalEntryPresentation[];
  error: string | null;
  goal: ReturnType<typeof useGoals>["items"][number] | null;
  handleAddEntry: () => Promise<void>;
  handleDeleteGoal: () => Promise<boolean>;
  isDeleteDialogOpen: boolean;
  isEntryAccountValid: boolean;
  isEntryAmountValid: boolean;
  isEntryDateValid: boolean;
  isEntryFormValid: boolean;
  isLoading: boolean;
  progressPercent: number;
  redirectAccountId: string;
  redirectGoalId: string;
  savedAmount: number;
  selectedEntryAccountId: string;
  selectedEntryCurrency: TransactionInputCurrency;
  setDeleteResolution: (value: GoalDeleteResolution) => void;
  setEntryAmountInput: (value: string) => void;
  setEntryDateInput: (value: string) => void;
  setEntryNoteInput: (value: string) => void;
  setIsDeleteDialogOpen: (value: boolean) => void;
  setRedirectAccountId: (value: string) => void;
  setRedirectGoalId: (value: string) => void;
  setSelectedEntryAccountId: (value: string) => void;
  setSelectedEntryCurrency: (value: TransactionInputCurrency) => void;
  targetAmount: number;
  visibleAccounts: ReturnType<typeof useAccounts>["items"];
  visibleGoalsForRedirect: ReturnType<typeof useGoals>["items"];
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const { items: goals, remove: removeGoal } = useGoals();
  const { items: accounts } = useAccounts();
  const { items: categories, create: createCategory } = useCategories();
  const {
    items: transactions,
    create: createTransaction,
    update: updateTransaction,
    remove: removeTransaction,
  } = useTransactions();

  const goal = useMemo(
    () => goals.find((item) => item.id === goalId) ?? null,
    [goalId, goals],
  );
  const goalEntries = useMemo(
    () => transactions.filter((transaction) => (
      transaction.transactionType === "saving" &&
      transaction.goalId === goalId
    )),
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

  const [entryAmountInput, setEntryAmountInput] = useState<string>("");
  const [entryDateInput, setEntryDateInput] = useState<string>(toIsoDate(new Date()));
  const [entryNoteInput, setEntryNoteInput] = useState<string>("");
  const [selectedEntryAccountId, setSelectedEntryAccountId] = useState<string>("");
  const [selectedEntryCurrency, setSelectedEntryCurrency] = useState<TransactionInputCurrency>("ARS");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deleteResolution, setDeleteResolution] = useState<GoalDeleteResolution>("delete_entries");
  const [redirectGoalId, setRedirectGoalId] = useState<string>("");
  const [redirectAccountId, setRedirectAccountId] = useState<string>("");

  const entryAmountValue = Number(entryAmountInput);
  const isEntryAmountValid = Number.isFinite(entryAmountValue) && entryAmountValue > 0;
  const isEntryDateValid = ISO_DATE_PATTERN.test(entryDateInput);
  const isEntryAccountValid = selectedEntryAccountId.trim().length > 0;
  const isEntryFormValid = isEntryAmountValid && isEntryDateValid && isEntryAccountValid && Boolean(goal);

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

  const handleAddEntry = async (): Promise<void> => {
    if (!goal || !isEntryFormValid) {
      return;
    }

    const amount = toArsTransactionAmount(Number(entryAmountInput), selectedEntryCurrency);
    const note = entryNoteInput.trim();
    const color = getGoalColorOption(goal.colorKey);

    const created = await createTransaction({
      icon: goal.icon,
      iconBg: color.iconBgClass,
      name: note || `Aporte ${goal.title}`,
      accountId: selectedEntryAccountId,
      category: getGoalCategoryName(goal.title),
      categoryId: goal.categoryId,
      date: entryDateInput,
      createdAt: new Date(`${entryDateInput}T12:00:00`).toISOString(),
      amount: `-$${amount.toFixed(2)}`,
      amountColor: "text-[#DC2626]",
      meta: `${entryDateInput} • ${note || "Entrada Goal"}`,
      transactionType: "saving",
      goalId: goal.id,
    });

    if (!created) {
      return;
    }

    setEntryAmountInput("");
    setEntryNoteInput("");
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
        await updateTransaction(entry.id, {
          goalId: targetGoal.id,
          categoryId: targetGoal.categoryId,
          category: getGoalCategoryName(targetGoal.title),
          transactionType: "saving",
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

  const isLoading = false;

  return {
    canConfirmDelete,
    deleteResolution,
    entryAmountInput,
    entryDateInput,
    entryNoteInput,
    entries,
    error: null,
    goal,
    handleAddEntry,
    handleDeleteGoal,
    isDeleteDialogOpen,
    isEntryAccountValid,
    isEntryAmountValid,
    isEntryDateValid,
    isEntryFormValid,
    isLoading,
    progressPercent,
    redirectAccountId,
    redirectGoalId,
    savedAmount,
    selectedEntryAccountId,
    selectedEntryCurrency,
    setDeleteResolution,
    setEntryAmountInput,
    setEntryDateInput,
    setEntryNoteInput,
    setIsDeleteDialogOpen,
    setRedirectAccountId,
    setRedirectGoalId,
    setSelectedEntryAccountId,
    setSelectedEntryCurrency,
    targetAmount,
    visibleAccounts: accounts,
    visibleGoalsForRedirect,
  };
};
