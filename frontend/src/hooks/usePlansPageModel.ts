import { useMemo, useState } from "react";
import { useCuotas } from "./useCuotas";
import { getCurrentMonthWindow, isCuotaActiveInMonth } from "@/utils";

export interface UsePlansPageModelOptions {
  onAddClick?: () => void;
}

export interface UsePlansPageModelResult {
  activeCuotas: ReturnType<typeof useCuotas>["items"];
  installmentsCountInput: string;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isInstallmentsCountValid: boolean;
  isLoading: boolean;
  isStartMonthValid: boolean;
  isTotalAmountValid: boolean;
  nameInput: string;
  setInstallmentsCountInput: (value: string) => void;
  setNameInput: (value: string) => void;
  setStartMonthInput: (value: string) => void;
  setTotalAmountInput: (value: string) => void;
  showValidation: boolean;
  startMonthInput: string;
  totalAmountInput: string;
  error: string | null;
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
}

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const getCurrentMonthInputValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const usePlansPageModel = (
  options: UsePlansPageModelOptions = {},
): UsePlansPageModelResult => {
  const { onAddClick } = options;
  const { items, isLoading, error, create } = useCuotas();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [totalAmountInput, setTotalAmountInput] = useState<string>("");
  const [installmentsCountInput, setInstallmentsCountInput] = useState<string>("");
  const [startMonthInput, setStartMonthInput] = useState<string>(getCurrentMonthInputValue);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const currentMonthWindow = useMemo(() => getCurrentMonthWindow(), []);

  const activeCuotas = useMemo(
    () => items.filter((item) => isCuotaActiveInMonth(item, currentMonthWindow)),
    [currentMonthWindow, items],
  );

  const totalAmountValue = Number(totalAmountInput);
  const installmentsCountValue = Number(installmentsCountInput);
  const normalizedStartMonth = startMonthInput.trim() || getCurrentMonthInputValue();
  const isTotalAmountValid = Number.isFinite(totalAmountValue) && totalAmountValue > 0;
  const isInstallmentsCountValid =
    Number.isFinite(installmentsCountValue) &&
    Number.isInteger(installmentsCountValue) &&
    installmentsCountValue >= 1;
  const isStartMonthValid = YEAR_MONTH_PATTERN.test(normalizedStartMonth);
  const isFormValid = isTotalAmountValid && isInstallmentsCountValid && isStartMonthValid;

  const resetEditor = () => {
    setIsEditorOpen(false);
    setNameInput("");
    setTotalAmountInput("");
    setInstallmentsCountInput("");
    setStartMonthInput(getCurrentMonthInputValue());
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
      startMonth: normalizedStartMonth,
    });

    if (!created) {
      return;
    }

    resetEditor();
  };

  return {
    activeCuotas,
    installmentsCountInput,
    isEditorOpen,
    isFormValid,
    isInstallmentsCountValid,
    isLoading,
    isStartMonthValid,
    isTotalAmountValid,
    nameInput,
    setInstallmentsCountInput,
    setNameInput,
    setStartMonthInput,
    setTotalAmountInput,
    showValidation,
    startMonthInput,
    totalAmountInput,
    error,
    handleCreate,
    handleHeaderAction,
  };
};
