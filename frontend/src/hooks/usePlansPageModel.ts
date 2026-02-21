import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrency } from "./useCurrency";
import { useCuotas } from "./useCuotas";
import type { CuotaPlanStatus, CuotaPlanWithStatus } from "@/types";
import {
  compareDateParts,
  getFulfilledInstallmentsByDate,
  getInstallmentDateParts,
  getTodayDatePartsLocal,
  isFutureDateParts,
  parseDateParts,
  toArsTransactionAmount,
  type TransactionInputCurrency,
} from "@/utils";

export interface UsePlansPageModelOptions {
  onAddClick?: () => void;
}

export type UsePlansPageModelFilterStatus = "all" | CuotaPlanStatus;

export interface UsePlansPageModelResult {
  activeCount: number;
  deleteConfirmPlanId: string | null;
  filteredPlans: CuotaPlanWithStatus[];
  finishedCount: number;
  creationDateInput: string;
  installmentsCountInput: string;
  isEditorOpen: boolean;
  isCreationDateValid: boolean;
  selectedCurrency: TransactionInputCurrency;
  isFormValid: boolean;
  isInstallmentsCountValid: boolean;
  isLoading: boolean;
  isTotalAmountValid: boolean;
  invalidDatePlanId: string | null;
  nameInput: string;
  paidFeedbackPlanId: string | null;
  pendingPaidPlanId: string | null;
  setCreationDateInput: (value: string) => void;
  setDeleteConfirmPlanId: (value: string | null) => void;
  setInstallmentsCountInput: (value: string) => void;
  setNameInput: (value: string) => void;
  setSelectedCurrency: (value: TransactionInputCurrency) => void;
  setStatusFilter: (value: UsePlansPageModelFilterStatus) => void;
  setTotalAmountInput: (value: string) => void;
  showValidation: boolean;
  statusFilter: UsePlansPageModelFilterStatus;
  totalCount: number;
  totalAmountInput: string;
  error: string | null;
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
  handleDeletePlan: (id: string) => Promise<void>;
  handleMarkInstallmentPaid: (id: string) => Promise<void>;
}

const getCurrentDateInputValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDateInput = (value: string): boolean => {
  const inputDate = parseDateParts(value);
  if (!inputDate) {
    return false;
  }

  return !isFutureDateParts(inputDate, getTodayDatePartsLocal());
};

const getPlanStatus = (paidInstallmentsCount: number, installmentsCount: number): CuotaPlanStatus => {
  return paidInstallmentsCount >= installmentsCount ? "finished" : "active";
};

export const usePlansPageModel = (
  options: UsePlansPageModelOptions = {},
): UsePlansPageModelResult => {
  const { onAddClick } = options;
  const { currency: appCurrency } = useCurrency();
  const { items, isLoading, error, create, update, remove } = useCuotas();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [totalAmountInput, setTotalAmountInput] = useState<string>("");
  const [installmentsCountInput, setInstallmentsCountInput] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<TransactionInputCurrency>(appCurrency);
  const [creationDateInput, setCreationDateInput] = useState<string>(getCurrentDateInputValue);
  const [statusFilter, setStatusFilter] = useState<UsePlansPageModelFilterStatus>("all");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [deleteConfirmPlanId, setDeleteConfirmPlanId] = useState<string | null>(null);
  const [pendingPaidPlanId, setPendingPaidPlanId] = useState<string | null>(null);
  const [paidFeedbackPlanId, setPaidFeedbackPlanId] = useState<string | null>(null);
  const [invalidDatePlanId, setInvalidDatePlanId] = useState<string | null>(null);
  const paidFeedbackTimeoutRef = useRef<number | null>(null);
  const invalidDateTimeoutRef = useRef<number | null>(null);
  const paidInstallmentsAutoSyncRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (paidFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(paidFeedbackTimeoutRef.current);
      }
      if (invalidDateTimeoutRef.current !== null) {
        window.clearTimeout(invalidDateTimeoutRef.current);
      }
    };
  }, []);

  const plansWithStatus = useMemo<CuotaPlanWithStatus[]>(
    () => items.map((item) => {
      const fulfilledByDate = getFulfilledInstallmentsByDate(item.createdAt);
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

  useEffect(() => {
    if (paidInstallmentsAutoSyncRef.current || items.length === 0) {
      return;
    }

    const plansToSync = items
      .map((item) => {
        const fulfilledByDate = Math.min(
          item.installmentsCount,
          getFulfilledInstallmentsByDate(item.createdAt),
        );
        const hasCategoryMetadata = Boolean(item.categoryId) && Boolean(item.subcategoryName);
        const nextPaidInstallmentsCount = Math.max(item.paidInstallmentsCount, fulfilledByDate);

        return {
          id: item.id,
          nextPaidInstallmentsCount,
          shouldSync: !hasCategoryMetadata || nextPaidInstallmentsCount > item.paidInstallmentsCount,
        };
      })
      .filter((plan) => plan.shouldSync);

    if (plansToSync.length === 0) {
      return;
    }

    paidInstallmentsAutoSyncRef.current = true;
    void (async () => {
      try {
        for (const plan of plansToSync) {
          await update(plan.id, {
            paidInstallmentsCount: plan.nextPaidInstallmentsCount,
          });
        }
      } finally {
        paidInstallmentsAutoSyncRef.current = false;
      }
    })();
  }, [items, update]);

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
    setSelectedCurrency(appCurrency);
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
    const normalizedTitle = nameInput.trim();

    const totalAmountArs = toArsTransactionAmount(totalAmountValue, selectedCurrency);

    const created = await create({
      title: normalizedTitle || undefined,
      subcategoryName: normalizedTitle || undefined,
      totalAmount: totalAmountArs,
      installmentsCount: installmentsCountValue,
      startMonth: normalizedCreationDate.slice(0, 7),
      createdAt: normalizedCreationDate,
      paidInstallmentsCount: Math.min(
        installmentsCountValue,
        getFulfilledInstallmentsByDate(`${normalizedCreationDate}T12:00:00`),
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

    const nextInstallmentIndex = targetPlan.paidInstallmentsCount + 1;
    const nextInstallmentDateParts = getInstallmentDateParts(
      targetPlan.createdAt,
      nextInstallmentIndex,
    );
    const isInvalidInstallmentDate = !nextInstallmentDateParts ||
      compareDateParts(nextInstallmentDateParts, getTodayDatePartsLocal()) > 0;
    if (isInvalidInstallmentDate) {
      setInvalidDatePlanId(id);
      if (invalidDateTimeoutRef.current !== null) {
        window.clearTimeout(invalidDateTimeoutRef.current);
      }
      invalidDateTimeoutRef.current = window.setTimeout(() => {
        setInvalidDatePlanId((current) => (current === id ? null : current));
        invalidDateTimeoutRef.current = null;
      }, 1800);
      return;
    }

    setPendingPaidPlanId(id);
    setInvalidDatePlanId((current) => (current === id ? null : current));

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

  const handleDeletePlan = async (id: string) => {
    if (!id || pendingPaidPlanId === id) {
      return;
    }

    const removed = await remove(id);
    if (!removed) {
      return;
    }

    setDeleteConfirmPlanId((current) => (current === id ? null : current));
    setPendingPaidPlanId((current) => (current === id ? null : current));
    setPaidFeedbackPlanId((current) => (current === id ? null : current));
    setInvalidDatePlanId((current) => (current === id ? null : current));
  };

  return {
    activeCount,
    creationDateInput,
    deleteConfirmPlanId,
    filteredPlans,
    finishedCount,
    installmentsCountInput,
    isEditorOpen,
    isCreationDateValid,
    selectedCurrency,
    isFormValid,
    isInstallmentsCountValid,
    isLoading,
    isTotalAmountValid,
    invalidDatePlanId,
    nameInput,
    paidFeedbackPlanId,
    pendingPaidPlanId,
    setCreationDateInput,
    setDeleteConfirmPlanId,
    setInstallmentsCountInput,
    setNameInput,
    setSelectedCurrency,
    setStatusFilter,
    setTotalAmountInput,
    showValidation,
    statusFilter,
    totalCount,
    totalAmountInput,
    error,
    handleCreate,
    handleDeletePlan,
    handleHeaderAction,
    handleMarkInstallmentPaid,
  };
};
