import { useMemo, useState } from "react";
import { useCurrency } from "./useCurrency";
import { useGoals } from "./useGoals";
import { useTransactions } from "./useTransactions";
import {
  formatCurrency,
  GOAL_COLOR_OPTIONS,
  GOAL_ICON_OPTIONS,
  getGoalColorOption,
  toArsTransactionAmount,
  type TransactionInputCurrency,
} from "@/utils";
import type { GoalColorKey } from "@/types";

export interface GoalsSummary {
  percent: number;
  totalSaved: number;
  totalTarget: number;
}

export interface GoalListPresentation {
  barColor: string;
  deadlineLabel: string;
  icon: string;
  iconBgClass: string;
  id: string;
  percent: number;
  percentBg: string;
  percentColor: string;
  savedAmountLabel: string;
  targetAmountLabel: string;
  title: string;
}

export interface UseGoalsPageModelOptions {
  onAddClick?: () => void;
}

export interface UseGoalsPageModelResult {
  colorOptions: Array<{ key: GoalColorKey; label: string; swatchClass: string }>;
  deadlineDateInput: string;
  error: string | null;
  goalRows: GoalListPresentation[];
  handleCreate: () => Promise<void>;
  handleCloseEditor: () => void;
  handleHeaderAction: () => void;
  iconOptions: string[];
  isDeadlineValid: boolean;
  isDescriptionValid: boolean;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isIconValid: boolean;
  isLoading: boolean;
  isTargetValid: boolean;
  isTitleValid: boolean;
  selectedColorKey: GoalColorKey;
  selectedCurrency: TransactionInputCurrency;
  selectedIcon: string;
  setDeadlineDateInput: (value: string) => void;
  setDescriptionInput: (value: string) => void;
  setSelectedColorKey: (value: GoalColorKey) => void;
  setSelectedCurrency: (value: TransactionInputCurrency) => void;
  setSelectedIcon: (value: string) => void;
  setTargetAmountInput: (value: string) => void;
  setTitleInput: (value: string) => void;
  showValidation: boolean;
  summary: GoalsSummary;
  targetAmountInput: string;
  titleInput: string;
  descriptionInput: string;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getTodayIsoDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (dateIso: string): string => {
  if (!ISO_DATE_PATTERN.test(dateIso)) {
    return dateIso;
  }

  const [year, month, day] = dateIso.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

export const useGoalsPageModel = (
  options: UseGoalsPageModelOptions = {},
): UseGoalsPageModelResult => {
  const { onAddClick } = options;
  const { currency: appCurrency } = useCurrency();
  const { items, isLoading, error, create } = useGoals();
  const { items: transactions } = useTransactions();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>("");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [targetAmountInput, setTargetAmountInput] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<TransactionInputCurrency>(appCurrency);
  const [deadlineDateInput, setDeadlineDateInput] = useState<string>(getTodayIsoDate);
  const [selectedIcon, setSelectedIcon] = useState<string>(GOAL_ICON_OPTIONS[0] ?? "target");
  const [selectedColorKey, setSelectedColorKey] = useState<GoalColorKey>("emerald");
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const targetAmountValue = Number(targetAmountInput);
  const normalizedTitle = titleInput.trim();
  const normalizedDescription = descriptionInput.trim();

  const isTitleValid = normalizedTitle.length > 0;
  const isDescriptionValid = normalizedDescription.length > 0;
  const isTargetValid = Number.isFinite(targetAmountValue) && targetAmountValue > 0;
  const isDeadlineValid = ISO_DATE_PATTERN.test(deadlineDateInput);
  const isIconValid = selectedIcon.trim().length > 0;
  const isFormValid = (
    isTitleValid &&
    isDescriptionValid &&
    isTargetValid &&
    isDeadlineValid &&
    isIconValid
  );

  const savedByGoalId = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (!transaction.goalId) {
        return;
      }

      const amount = Number(transaction.amount.replace(/[^0-9+.-]/g, ""));
      if (!Number.isFinite(amount) || amount >= 0) {
        return;
      }

      map.set(transaction.goalId, (map.get(transaction.goalId) ?? 0) + Math.abs(amount));
    });

    return map;
  }, [transactions]);

  const summary = useMemo<GoalsSummary>(() => {
    const totalSaved = items.reduce((sum, goal) => sum + (savedByGoalId.get(goal.id) ?? 0), 0);
    const totalTarget = items.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const percent = totalTarget > 0 ? clampPercent((totalSaved / totalTarget) * 100) : 0;

    return {
      totalSaved,
      totalTarget,
      percent,
    };
  }, [items, savedByGoalId]);

  const goalRows = useMemo<GoalListPresentation[]>(() => {
    return items.map((goal) => {
      const savedAmount = savedByGoalId.get(goal.id) ?? 0;
      const percent = goal.targetAmount > 0
        ? clampPercent((savedAmount / goal.targetAmount) * 100)
        : 0;
      const color = getGoalColorOption(goal.colorKey);

      return {
        id: goal.id,
        icon: goal.icon,
        iconBgClass: color.iconBgClass,
        title: goal.title,
        deadlineLabel: formatDateLabel(goal.deadlineDate),
        percent,
        percentBg: color.softBgClass,
        percentColor: color.textClass,
        barColor: color.barClass,
        savedAmountLabel: formatCurrency(savedAmount),
        targetAmountLabel: formatCurrency(goal.targetAmount),
      };
    });
  }, [items, savedByGoalId]);

  const resetEditor = () => {
    setIsEditorOpen(false);
    setTitleInput("");
    setDescriptionInput("");
    setTargetAmountInput("");
    setSelectedCurrency(appCurrency);
    setDeadlineDateInput(getTodayIsoDate());
    setSelectedIcon(GOAL_ICON_OPTIONS[0] ?? "target");
    setSelectedColorKey("emerald");
    setShowValidation(false);
  };

  const handleCloseEditor = () => {
    resetEditor();
  };

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      handleCloseEditor();
    } else {
      setIsEditorOpen(true);
      setSelectedCurrency(appCurrency);
      setShowValidation(false);
      onAddClick?.();
    }
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const normalizedTargetAmount = toArsTransactionAmount(targetAmountValue, selectedCurrency);

    const created = await create({
      title: normalizedTitle,
      description: normalizedDescription,
      targetAmount: normalizedTargetAmount,
      deadlineDate: deadlineDateInput,
      icon: selectedIcon,
      colorKey: selectedColorKey,
    });

    if (!created) {
      return;
    }

    resetEditor();
  };

  return {
    colorOptions: GOAL_COLOR_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      swatchClass: option.iconBgClass,
    })),
    deadlineDateInput,
    descriptionInput,
    error,
    goalRows,
    handleCreate,
    handleCloseEditor,
    handleHeaderAction,
    iconOptions: GOAL_ICON_OPTIONS,
    isDeadlineValid,
    isDescriptionValid,
    isEditorOpen,
    isFormValid,
    isIconValid,
    isLoading,
    isTargetValid,
    isTitleValid,
    selectedColorKey,
    selectedCurrency,
    selectedIcon,
    setDeadlineDateInput,
    setDescriptionInput,
    setSelectedColorKey,
    setSelectedCurrency,
    setSelectedIcon,
    setTargetAmountInput,
    setTitleInput,
    showValidation,
    summary,
    targetAmountInput,
    titleInput,
  };
};
