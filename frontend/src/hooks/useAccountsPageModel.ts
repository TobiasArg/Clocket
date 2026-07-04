import { useCallback, useMemo, useState } from "react";
import {
  ACCOUNT_ICON_OPTIONS,
  DEFAULT_ACCOUNT_ICON,
} from "@/utils";
import {
  buildAccountFlowsById,
  getDisplayedAccountBalance,
  type AccountFlowSummary,
} from "@/domain/accounts/accountBalances";
import { useAccounts } from "./useAccounts";
import { useCurrency } from "./useCurrency";
import { useTransactions } from "./useTransactions";

export type AccountFlow = AccountFlowSummary;

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

export const useAccountsPageModel = (
  options: UseAccountsPageModelOptions = {},
): UseAccountsPageModelResult => {
  const { onAddClick } = options;

  const { currency: appCurrency, usdArsRateState } = useCurrency();
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

  const accountFlowsById = useMemo(() => buildAccountFlowsById(transactions), [transactions]);

  const totalBalance = useMemo(
    () => items.reduce((sum, account) => sum + getDisplayedAccountBalance(
      account,
      accountFlowsById.get(account.id),
      appCurrency,
      usdArsRateState.rate,
    ), 0),
    [accountFlowsById, appCurrency, items, usdArsRateState.rate],
  );

  const visibleAccounts = useMemo(
    () => items.map((account) => ({
      ...account,
      balance: getDisplayedAccountBalance(
        account,
        accountFlowsById.get(account.id),
        appCurrency,
        usdArsRateState.rate,
      ),
    })),
    [accountFlowsById, appCurrency, items, usdArsRateState.rate],
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
      currency: appCurrency,
      icon: normalizedIcon,
    });

    if (!created) {
      return;
    }

    handleCloseEditor();
  }, [appCurrency, isFormValid, normalizedName, balanceValue, normalizedIcon, create, handleCloseEditor]);

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
