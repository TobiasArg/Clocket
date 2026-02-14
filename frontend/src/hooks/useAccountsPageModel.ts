import { useMemo, useState } from "react";
import { useAccounts } from "./useAccounts";
import { useTransactions } from "./useTransactions";

export interface AccountFlow {
  expense: number;
  income: number;
}

export interface UseAccountsPageModelOptions {
  onAddClick?: () => void;
}

export interface UseAccountsPageModelResult {
  accountFlowsById: Map<string, AccountFlow>;
  balanceInput: string;
  error: string | null;
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
  isBalanceValid: boolean;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isNameValid: boolean;
  itemsCount: number;
  nameInput: string;
  setBalanceInput: (value: string) => void;
  setNameInput: (value: string) => void;
  showValidation: boolean;
  totalBalance: number;
  visibleAccounts: ReturnType<typeof useAccounts>["items"];
}

const parseSignedAmountValue = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const useAccountsPageModel = (
  options: UseAccountsPageModelOptions = {},
): UseAccountsPageModelResult => {
  const { onAddClick } = options;

  const { items, isLoading, error, create } = useAccounts();
  const { items: transactions } = useTransactions();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [balanceInput, setBalanceInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const normalizedName = nameInput.trim();
  const balanceValue = Number(balanceInput);
  const isNameValid = normalizedName.length > 0;
  const isBalanceValid = Number.isFinite(balanceValue);
  const isFormValid = isNameValid && isBalanceValid;

  const totalBalance = useMemo(
    () => items.reduce((sum, account) => sum + account.balance, 0),
    [items],
  );

  const accountFlowsById = useMemo(() => {
    const map = new Map<string, AccountFlow>();

    transactions.forEach((transaction) => {
      const amount = parseSignedAmountValue(transaction.amount);
      const current = map.get(transaction.accountId) ?? { income: 0, expense: 0 };

      if (amount > 0) {
        current.income += amount;
      } else if (amount < 0) {
        current.expense += Math.abs(amount);
      }

      map.set(transaction.accountId, current);
    });

    return map;
  }, [transactions]);

  const resetEditor = () => {
    setIsEditorOpen(false);
    setNameInput("");
    setBalanceInput("");
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
      name: normalizedName,
      balance: balanceValue,
    });

    if (!created) {
      return;
    }

    resetEditor();
  };

  return {
    accountFlowsById,
    balanceInput,
    error,
    handleCreate,
    handleHeaderAction,
    isBalanceValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    isNameValid,
    itemsCount: items.length,
    nameInput,
    setBalanceInput,
    setNameInput,
    showValidation,
    totalBalance,
    visibleAccounts: items,
  };
};
