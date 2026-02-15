import { useEffect, useMemo, useRef, useState } from "react";
import { useCuotas } from "./useCuotas";
import type { CuotaPlanStatus, CuotaPlanWithStatus } from "@/types";

export interface UsePlansPageModelOptions {
  onAddClick?: () => void;
}

export type UsePlansPageModelFilterStatus = "all" | CuotaPlanStatus;

export interface UsePlansPageModelResult {
  activeCount: number;
  filteredPlans: CuotaPlanWithStatus[];
  finishedCount: number;
  creationDateInput: string;
  installmentsCountInput: string;
  isEditorOpen: boolean;
  isCreationDateValid: boolean;
  isFormValid: boolean;
  isInstallmentsCountValid: boolean;
  isLoading: boolean;
  isTotalAmountValid: boolean;
  nameInput: string;
  paidFeedbackPlanId: string | null;
  pendingPaidPlanId: string | null;
  setCreationDateInput: (value: string) => void;
  setInstallmentsCountInput: (value: string) => void;
  setNameInput: (value: string) => void;
  setStatusFilter: (value: UsePlansPageModelFilterStatus) => void;
  setTotalAmountInput: (value: string) => void;
  showValidation: boolean;
  statusFilter: UsePlansPageModelFilterStatus;
  totalCount: number;
  totalAmountInput: string;
  error: string | null;
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
  handleMarkInstallmentPaid: (id: string) => Promise<void>;
}

const YEAR_MONTH_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const getCurrentDateInputValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDateInput = (value: string): boolean => {
  const match = YEAR_MONTH_DAY_PATTERN.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day;
};

const getDaysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const getFulfilledInstallmentsByCreatedAt = (
  createdAt: string,
  now: Date = new Date(),
): number => {
  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    return 0;
  }

  const createdDate = new Date(
    createdAtDate.getFullYear(),
    createdAtDate.getMonth(),
    createdAtDate.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today < createdDate) {
    return 0;
  }

  const monthsDifference = (today.getFullYear() - createdDate.getFullYear()) * 12 +
    (today.getMonth() - createdDate.getMonth());
  const dueDayOfCurrentMonth = Math.min(
    createdDate.getDate(),
    getDaysInMonth(today.getFullYear(), today.getMonth()),
  );

  const fulfilledInstallments = monthsDifference - (today.getDate() < dueDayOfCurrentMonth ? 1 : 0);
  return Math.max(0, fulfilledInstallments);
};

const getPlanStatus = (paidInstallmentsCount: number, installmentsCount: number): CuotaPlanStatus => {
  return paidInstallmentsCount >= installmentsCount ? "finished" : "active";
};

export const usePlansPageModel = (
  options: UsePlansPageModelOptions = {},
): UsePlansPageModelResult => {
  const { onAddClick } = options;
  const { items, isLoading, error, create, update } = useCuotas();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [totalAmountInput, setTotalAmountInput] = useState<string>("");
  const [installmentsCountInput, setInstallmentsCountInput] = useState<string>("");
  const [creationDateInput, setCreationDateInput] = useState<string>(getCurrentDateInputValue);
  const [statusFilter, setStatusFilter] = useState<UsePlansPageModelFilterStatus>("all");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [pendingPaidPlanId, setPendingPaidPlanId] = useState<string | null>(null);
  const [paidFeedbackPlanId, setPaidFeedbackPlanId] = useState<string | null>(null);
  const paidFeedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (paidFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(paidFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const plansWithStatus = useMemo<CuotaPlanWithStatus[]>(
    () => items.map((item) => {
      const fulfilledByDate = getFulfilledInstallmentsByCreatedAt(item.createdAt);
      const effectivePaidInstallments = Math.min(
        item.installmentsCount,
        Math.max(item.paidInstallmentsCount, fulfilledByDate),
      );

      return {
        ...item,
        paidInstallmentsCount: effectivePaidInstallments,
        status: getPlanStatus(effectivePaidInstallments, item.installmentsCount),
      };
    }),
    [items],
  );

  const totalCount = plansWithStatus.length;

  const activeCount = useMemo(
    () => plansWithStatus.filter((plan) => plan.status === "active").length,
    [plansWithStatus],
  );

  const finishedCount = useMemo(
    () => plansWithStatus.filter((plan) => plan.status === "finished").length,
    [plansWithStatus],
  );

  const filteredPlans = useMemo(
    () => (
      statusFilter === "all"
        ? plansWithStatus
        : plansWithStatus.filter((plan) => plan.status === statusFilter)
    ),
    [plansWithStatus, statusFilter],
  );

  const totalAmountValue = Number(totalAmountInput);
  const installmentsCountValue = Number(installmentsCountInput);
  const normalizedCreationDate = creationDateInput.trim() || getCurrentDateInputValue();
  const isTotalAmountValid = Number.isFinite(totalAmountValue) && totalAmountValue > 0;
  const isInstallmentsCountValid =
    Number.isFinite(installmentsCountValue) &&
    Number.isInteger(installmentsCountValue) &&
    installmentsCountValue >= 1;
  const isCreationDateValid = isValidDateInput(normalizedCreationDate);
  const isFormValid = isTotalAmountValid &&
    isInstallmentsCountValid &&
    isCreationDateValid;

  const resetEditor = () => {
    setIsEditorOpen(false);
    setNameInput("");
    setTotalAmountInput("");
    setInstallmentsCountInput("");
    setCreationDateInput(getCurrentDateInputValue());
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
      title: nameInput.trim() || undefined,
      totalAmount: totalAmountValue,
      installmentsCount: installmentsCountValue,
      startMonth: normalizedCreationDate.slice(0, 7),
      createdAt: normalizedCreationDate,
      paidInstallmentsCount: Math.min(
        installmentsCountValue,
        getFulfilledInstallmentsByCreatedAt(`${normalizedCreationDate}T12:00:00`),
      ),
    });

    if (!created) {
      return;
    }

    resetEditor();
  };

  const handleMarkInstallmentPaid = async (id: string) => {
    const targetPlan = plansWithStatus.find((item) => item.id === id);
    if (!targetPlan || pendingPaidPlanId === id) {
      return;
    }

    if (targetPlan.status === "finished") {
      return;
    }

    setPendingPaidPlanId(id);

    const updated = await update(id, {
      paidInstallmentsCount: Math.min(
        targetPlan.installmentsCount,
        targetPlan.paidInstallmentsCount + 1,
      ),
    });

    setPendingPaidPlanId((current) => (current === id ? null : current));

    if (!updated) {
      return;
    }

    setPaidFeedbackPlanId(id);
    if (paidFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(paidFeedbackTimeoutRef.current);
    }
    paidFeedbackTimeoutRef.current = window.setTimeout(() => {
      setPaidFeedbackPlanId((current) => (current === id ? null : current));
      paidFeedbackTimeoutRef.current = null;
    }, 850);
  };

  return {
    activeCount,
    creationDateInput,
    filteredPlans,
    finishedCount,
    installmentsCountInput,
    isEditorOpen,
    isCreationDateValid,
    isFormValid,
    isInstallmentsCountValid,
    isLoading,
    isTotalAmountValid,
    nameInput,
    paidFeedbackPlanId,
    pendingPaidPlanId,
    setCreationDateInput,
    setInstallmentsCountInput,
    setNameInput,
    setStatusFilter,
    setTotalAmountInput,
    showValidation,
    statusFilter,
    totalCount,
    totalAmountInput,
    error,
    handleCreate,
    handleHeaderAction,
    handleMarkInstallmentPaid,
  };
};
