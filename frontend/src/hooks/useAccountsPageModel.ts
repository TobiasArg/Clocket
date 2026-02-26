import { useCallback, useMemo, useState } from "react";
import {
  ACCOUNT_ICON_OPTIONS,
  DEFAULT_ACCOUNT_ICON,
} from "@/utils";
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
  accountIconOptions: string[];
  balanceInput: string;
  cancelDeleteAccount: () => void;
  confirmDeleteAccount: () => Promise<void>;
  deleteConfirmAccountName: string;
  deleteConfirmTransactionsCount: number;
  error: string | null;
  handleCloseEditor: () => void;
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
  isBalanceValid: boolean;
  isDeleteConfirmOpen: boolean;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isIconValid: boolean;
  isLoading: boolean;
  isNameValid: boolean;
  itemsCount: number;
  nameInput: string;
  pendingDeleteAccountId: string | null;
  requestDeleteAccount: (id: string) => void;
  selectedIcon: string;
  setBalanceInput: (value: string) => void;
  setNameInput: (value: string) => void;
  setSelectedIcon: (value: string) => void;
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
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [pendingDeleteAccountId, setPendingDeleteAccountId] = useState<string | null>(null);
  const [deleteConfirmAccountId, setDeleteConfirmAccountId] = useState<string | null>(null);

  const accountIconOptions = useMemo(() => [...ACCOUNT_ICON_OPTIONS], []);

  const normalizedName = nameInput.trim();
  const normalizedIcon = selectedIcon.trim();
  const balanceValue = Number(balanceInput);
  const isNameValid = normalizedName.length > 0;
  const isBalanceValid = Number.isFinite(balanceValue);
  const isIconValid = normalizedIcon.length > 0;
  const isFormValid = isNameValid && isBalanceValid && isIconValid;

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

  const resetEditorFields = useCallback(() => {
    setNameInput("");
    setBalanceInput("");
    setSelectedIcon("");
    setShowValidation(false);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    resetEditorFields();
  }, [resetEditorFields]);

  const handleOpenEditor = useCallback(() => {
    setIsEditorOpen(true);
    setSelectedIcon(DEFAULT_ACCOUNT_ICON);
    setShowValidation(false);
    onAddClick?.();
  }, [onAddClick]);

  const handleHeaderAction = useCallback(() => {
    if (isEditorOpen) {
      handleCloseEditor();
      return;
    }

    handleOpenEditor();
  }, [isEditorOpen, handleCloseEditor, handleOpenEditor]);

  const handleCreate = useCallback(async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const created = await create({
      name: normalizedName,
      balance: balanceValue,
      icon: normalizedIcon,
    });

    if (!created) {
      return;
    }

    handleCloseEditor();
  }, [isFormValid, normalizedName, balanceValue, normalizedIcon, create, handleCloseEditor]);

  const requestDeleteAccount = useCallback((id: string): void => {
    if (!id || pendingDeleteAccountId) {
      return;
    }

    const exists = items.some((account) => account.id === id);
    if (!exists) {
      return;
    }

    setDeleteConfirmAccountId(id);
  }, [pendingDeleteAccountId, items]);

  const cancelDeleteAccount = useCallback((): void => {
    if (pendingDeleteAccountId) {
      return;
    }

    setDeleteConfirmAccountId(null);
  }, [pendingDeleteAccountId]);

  const confirmDeleteAccount = useCallback(async (): Promise<void> => {
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
  }, [deleteConfirmAccountId, pendingDeleteAccountId, remove, refreshTransactions]);

  return {
    accountFlowsById,
    accountIconOptions,
    balanceInput,
    cancelDeleteAccount,
    confirmDeleteAccount,
    deleteConfirmAccountName: deleteConfirmAccount?.name ?? "",
    deleteConfirmTransactionsCount,
    error,
    handleCloseEditor,
    handleCreate,
    handleHeaderAction,
    isBalanceValid,
    isDeleteConfirmOpen: deleteConfirmAccountId !== null,
    isEditorOpen,
    isFormValid,
    isIconValid,
    isLoading,
    isNameValid,
    itemsCount: items.length,
    nameInput,
    pendingDeleteAccountId,
    requestDeleteAccount,
    selectedIcon,
    setBalanceInput,
    setNameInput,
    setSelectedIcon,
    showValidation,
    totalBalance,
    visibleAccounts,
  };
};
