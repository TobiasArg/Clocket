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
  cancelDeleteAccount: () => void;
  confirmDeleteAccount: () => Promise<void>;
  deleteConfirmAccountName: string;
  deleteConfirmTransactionsCount: number;
  error: string | null;
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
  isBalanceValid: boolean;
  isDeleteConfirmOpen: boolean;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isNameValid: boolean;
  itemsCount: number;
  nameInput: string;
  pendingDeleteAccountId: string | null;
  requestDeleteAccount: (id: string) => void;
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

  const { items, isLoading, error, create, remove } = useAccounts();
  const { items: transactions, refresh: refreshTransactions } = useTransactions();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [balanceInput, setBalanceInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [pendingDeleteAccountId, setPendingDeleteAccountId] = useState<string | null>(null);
  const [deleteConfirmAccountId, setDeleteConfirmAccountId] = useState<string | null>(null);

  const normalizedName = nameInput.trim();
  const balanceValue = Number(balanceInput);
  const isNameValid = normalizedName.length > 0;
  const isBalanceValid = Number.isFinite(balanceValue);
  const isFormValid = isNameValid && isBalanceValid;

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

  const accountNetById = useMemo(() => {
    const map = new Map<string, number>();
    accountFlowsById.forEach((flow, accountId) => {
      map.set(accountId, flow.income - flow.expense);
    });
    return map;
  }, [accountFlowsById]);

  const totalBalance = useMemo(
    () => Array.from(accountNetById.values()).reduce((sum, value) => sum + value, 0),
    [accountNetById],
  );

  const visibleAccounts = useMemo(
    () => items.map((account) => ({
      ...account,
      balance: accountNetById.get(account.id) ?? 0,
    })),
    [accountNetById, items],
  );

  const deleteConfirmAccount = useMemo(
    () => items.find((account) => account.id === deleteConfirmAccountId) ?? null,
    [deleteConfirmAccountId, items],
  );
  const deleteConfirmTransactionsCount = useMemo(
    () => (deleteConfirmAccountId
      ? transactions.filter((transaction) => transaction.accountId === deleteConfirmAccountId).length
      : 0),
    [deleteConfirmAccountId, transactions],
  );

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

  const requestDeleteAccount = (id: string): void => {
    if (!id || pendingDeleteAccountId) {
      return;
    }

    const exists = items.some((account) => account.id === id);
    if (!exists) {
      return;
    }

    setDeleteConfirmAccountId(id);
  };

  const cancelDeleteAccount = (): void => {
    if (pendingDeleteAccountId) {
      return;
    }

    setDeleteConfirmAccountId(null);
  };

  const confirmDeleteAccount = async (): Promise<void> => {
    if (!deleteConfirmAccountId || pendingDeleteAccountId === deleteConfirmAccountId) {
      return;
    }

    setPendingDeleteAccountId(deleteConfirmAccountId);
    const removed = await remove(deleteConfirmAccountId);
    if (removed) {
      await refreshTransactions();
      setDeleteConfirmAccountId(null);
    }
    setPendingDeleteAccountId((current) => (current === deleteConfirmAccountId ? null : current));
  };

  return {
    accountFlowsById,
    balanceInput,
    cancelDeleteAccount,
    confirmDeleteAccount,
    deleteConfirmAccountName: deleteConfirmAccount?.name ?? "",
    deleteConfirmTransactionsCount,
    error,
    handleCreate,
    handleHeaderAction,
    isBalanceValid,
    isDeleteConfirmOpen: deleteConfirmAccountId !== null,
    isEditorOpen,
    isFormValid,
    isLoading,
    isNameValid,
    itemsCount: items.length,
    nameInput,
    pendingDeleteAccountId,
    requestDeleteAccount,
    setBalanceInput,
    setNameInput,
    showValidation,
    totalBalance,
    visibleAccounts,
  };
};
