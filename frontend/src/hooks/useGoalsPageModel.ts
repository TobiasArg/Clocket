import { useMemo, useState } from "react";
import { useGoals } from "./useGoals";
import { formatCurrency } from "@/utils";

export interface GoalsSummary {
  percent: number;
  totalSaved: number;
  totalTarget: number;
}

export interface GoalListPresentation {
  barColor: string;
  id: string;
  icon: string;
  percent: number;
  percentBg: string;
  percentColor: string;
  savedAmountLabel: string;
  targetAmountLabel: string;
  targetMonthLabel: string;
  title: string;
}

export interface UseGoalsPageModelOptions {
  onAddClick?: () => void;
}

export interface UseGoalsPageModelResult {
  error: string | null;
  goalRows: GoalListPresentation[];
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
  handleRemove: (id: string) => Promise<void>;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isSavedValid: boolean;
  isTargetValid: boolean;
  isTitleValid: boolean;
  savedAmountInput: string;
  setSavedAmountInput: (value: string) => void;
  setTargetAmountInput: (value: string) => void;
  setTargetMonthInput: (value: string) => void;
  setTitleInput: (value: string) => void;
  showValidation: boolean;
  summary: GoalsSummary;
  targetAmountInput: string;
  targetMonthInput: string;
  titleInput: string;
}

const GOAL_ICONS = ["airplane-tilt", "device-mobile", "target", "piggy-bank"] as const;

const getCurrentYearMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (yearMonth: string): string => {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const formatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
  const formatted = formatter.format(date);
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const getProgressStyles = (percent: number) => {
  if (percent >= 70) {
    return {
      percentColor: "text-[#10B981]",
      percentBg: "bg-[#D1FAE5]",
      barColor: "bg-[#10B981]",
    };
  }

  if (percent >= 40) {
    return {
      percentColor: "text-[#D97706]",
      percentBg: "bg-[#FEF3C7]",
      barColor: "bg-[#D97706]",
    };
  }

  return {
    percentColor: "text-[#DC2626]",
    percentBg: "bg-[#FEE2E2]",
    barColor: "bg-[#DC2626]",
  };
};

export const useGoalsPageModel = (
  options: UseGoalsPageModelOptions = {},
): UseGoalsPageModelResult => {
  const { onAddClick } = options;
  const { items, isLoading, error, create, remove } = useGoals();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>("");
  const [targetAmountInput, setTargetAmountInput] = useState<string>("");
  const [savedAmountInput, setSavedAmountInput] = useState<string>("");
  const [targetMonthInput, setTargetMonthInput] = useState<string>(getCurrentYearMonth);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const targetAmountValue = Number(targetAmountInput);
  const savedAmountValue = Number(savedAmountInput || "0");
  const normalizedTitle = titleInput.trim();

  const isTitleValid = normalizedTitle.length > 0;
  const isTargetValid = Number.isFinite(targetAmountValue) && targetAmountValue > 0;
  const isSavedValid = Number.isFinite(savedAmountValue) && savedAmountValue >= 0;
  const isFormValid = isTitleValid && isTargetValid && isSavedValid;

  const summary = useMemo<GoalsSummary>(() => {
    const totalSaved = items.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalTarget = items.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const percent = totalTarget > 0 ? clampPercent((totalSaved / totalTarget) * 100) : 0;

    return {
      totalSaved,
      totalTarget,
      percent,
    };
  }, [items]);

  const goalRows = useMemo<GoalListPresentation[]>(() => {
    return items.map((goal, index) => {
      const percent = goal.targetAmount > 0
        ? clampPercent((goal.savedAmount / goal.targetAmount) * 100)
        : 0;
      const styles = getProgressStyles(percent);

      return {
        id: goal.id,
        icon: GOAL_ICONS[index % GOAL_ICONS.length],
        title: goal.title,
        targetMonthLabel: formatMonthLabel(goal.targetMonth),
        percent,
        percentBg: styles.percentBg,
        percentColor: styles.percentColor,
        barColor: styles.barColor,
        savedAmountLabel: formatCurrency(goal.savedAmount),
        targetAmountLabel: formatCurrency(goal.targetAmount),
      };
    });
  }, [items]);

  const resetEditor = () => {
    setIsEditorOpen(false);
    setTitleInput("");
    setTargetAmountInput("");
    setSavedAmountInput("");
    setTargetMonthInput(getCurrentYearMonth());
    setShowValidation(false);
  };

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      resetEditor();
    } else {
      setIsEditorOpen(true);
      setShowValidation(false);
    }

    onAddClick?.();
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const created = await create({
      title: normalizedTitle,
      targetAmount: targetAmountValue,
      savedAmount: savedAmountValue,
      targetMonth: targetMonthInput,
    });

    if (!created) {
      return;
    }

    resetEditor();
  };

  const handleRemove = async (id: string): Promise<void> => {
    await remove(id);
  };

  return {
    error,
    goalRows,
    handleCreate,
    handleHeaderAction,
    handleRemove,
    isEditorOpen,
    isFormValid,
    isLoading,
    isSavedValid,
    isTargetValid,
    isTitleValid,
    savedAmountInput,
    setSavedAmountInput,
    setTargetAmountInput,
    setTargetMonthInput,
    setTitleInput,
    showValidation,
    summary,
    targetAmountInput,
    targetMonthInput,
    titleInput,
  };
};
