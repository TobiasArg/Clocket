import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrency } from "./useCurrency";
import { useCuotas } from "./useCuotas";
import type { CuotaPlanStatus, CuotaPlanWithStatus } from "@/types";
import {
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
  handleCloseEditor: () => void;
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
  const { items, isLoading, error, create, markPaid, reconcileDue, remove } = useCuotas();

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
  const reconcileDueRequestedRef = useRef<boolean>(false);

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
      return {
        ...item,
        status: getPlanStatus(item.paidInstallmentsCount, item.installmentsCount),
      };
    }),
    [items],
  );

  useEffect(() => {
    if (reconcileDueRequestedRef.current || isLoading || items.length === 0) {
      return;
    }

    reconcileDueRequestedRef.current = true;
    void reconcileDue();
  }, [isLoading, items.length, reconcileDue]);

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

  const resetEditor = useCallback(() => {
    setIsEditorOpen(false);
    setNameInput("");
    setTotalAmountInput("");
    setInstallmentsCountInput("");
    setSelectedCurrency(appCurrency);
    setCreationDateInput(getCurrentDateInputValue());
    setShowValidation(false);
  }, [appCurrency]);

  const handleCloseEditor = useCallback(() => {
    resetEditor();
  }, [resetEditor]);

  const handleHeaderAction = useCallback(() => {
    if (isEditorOpen) {
      handleCloseEditor();
    } else {
      setIsEditorOpen(true);
      setShowValidation(false);
      onAddClick?.();
    }
  }, [isEditorOpen, handleCloseEditor, onAddClick]);

  const handleCreate = useCallback(async () => {
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
      paidInstallmentsCount: 0,
    });

    if (!created) {
      return;
    }

    resetEditor();
    void reconcileDue();
  }, [
    isFormValid,
    nameInput,
    totalAmountValue,
    selectedCurrency,
    installmentsCountValue,
    normalizedCreationDate,
    create,
    reconcileDue,
    resetEditor,
  ]);

  const handleMarkInstallmentPaid = useCallback(async (id: string) => {
    const targetPlan = plansWithStatus.find((item) => item.id === id);
    if (!targetPlan || pendingPaidPlanId === id) {
      return;
    }

    if (targetPlan.status === "finished") {
      return;
    }

    setPendingPaidPlanId(id);
    setInvalidDatePlanId((current) => (current === id ? null : current));

    const result = await markPaid(id);

    setPendingPaidPlanId((current) => (current === id ? null : current));

    if (!result) {
      return;
    }

    if (result.status === "blocked_future") {
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

    if (result.status !== "paid") {
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
  }, [markPaid, plansWithStatus, pendingPaidPlanId]);

  const handleDeletePlan = useCallback(async (id: string) => {
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
  }, [pendingPaidPlanId, remove]);

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
    handleCloseEditor,
    handleCreate,
    handleDeletePlan,
    handleHeaderAction,
    handleMarkInstallmentPaid,
  };
};
