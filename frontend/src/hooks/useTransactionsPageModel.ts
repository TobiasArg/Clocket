import { useEffect, useMemo, useState } from "react";
import { useAccounts } from "./useAccounts";
import { useCategories } from "./useCategories";
import { useCuotas } from "./useCuotas";
import { useTransactions } from "./useTransactions";
import {
  getMonthlyBalance,
  getPendingInstallmentsTotalForMonth,
  getTransactionDateForMonthBalance,
  toArsTransactionAmount,
  type TransactionItem,
  type TransactionInputCurrency,
} from "@/utils";

export interface TransactionsMonthGroup {
  title: string;
  total: string;
  totalColor: string;
  transactions: TransactionItem[];
}

export type AmountSign = "+" | "-";
export type TransactionsEditorMode = "create" | "edit" | null;

export interface UseTransactionsPageModelOptions {
  onFilterClick?: () => void;
  onTransactionClick?: (monthIndex: number, txIndex: number) => void;
  uncategorizedAccountLabel?: string;
  uncategorizedLabel?: string;
}

export interface UseTransactionsPageModelResult {
  accountsError: string | null;
  amountInput: string;
  cancelDeleteTransaction: () => void;
  categoriesError: string | null;
  confirmDeleteTransaction: () => Promise<void>;
  deleteConfirmTransactionName: string;
  descriptionInput: string;
  editorMode: TransactionsEditorMode;
  editingAmountSign: AmountSign;
  error: string | null;
  handleHeaderAction: () => void;
  handleSubmit: () => Promise<void>;
  handleTransactionRowClick: (
    transaction: TransactionItem,
    monthIndex: number,
    transactionIndex: number,
  ) => void;
  hasMonthlyTransactions: boolean;
  isAccountValid: boolean;
  isAccountsLoading: boolean;
  isAmountValid: boolean;
  isCategoriesLoading: boolean;
  isCuotasLoading: boolean;
  isDeleteConfirmOpen: boolean;
  isDescriptionValid: boolean;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  itemsCount: number;
  monthGroups: TransactionsMonthGroup[];
  cuotasCount: number;
  monthlyBalance: ReturnType<typeof getMonthlyBalance>;
  monthlyPendingInstallments: number;
  pendingDeleteTransactionId: string | null;
  requestDeleteTransaction: (id: string) => void;
  selectedAccountId: string;
  selectedCurrency: TransactionInputCurrency;
  selectedCategoryId: string;
  selectedTransaction: TransactionItem | null;
  setAmountInput: (value: string) => void;
  setDescriptionInput: (value: string) => void;
  setEditingAmountSign: (value: AmountSign) => void;
  setSelectedAccountId: (value: string) => void;
  setSelectedCurrency: (value: TransactionInputCurrency) => void;
  setSelectedCategoryId: (value: string) => void;
  showSaved: boolean;
  showValidation: boolean;
  sortedAccounts: ReturnType<typeof useAccounts>["items"];
  sortedCategories: ReturnType<typeof useCategories>["items"];
  resolveAccountLabel: (transaction: TransactionItem) => string;
  resolveCategoryLabel: (transaction: TransactionItem) => string;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
});

const parseSignedAmountValue = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseAmountSign = (value: string): AmountSign => {
  return value.trim().startsWith("+") ? "+" : "-";
};

const formatMonthTitle = (date: Date): string => {
  const label = MONTH_FORMATTER.format(date);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
};

const formatTotalAmount = (value: number): string => {
  const absolute = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (value < 0) {
    return `-$${absolute}`;
  }

  if (value > 0) {
    return `+$${absolute}`;
  }

  return `$${absolute}`;
};

const formatAmountWithSign = (value: number, sign: AmountSign): string => {
  return `${sign}$${value.toFixed(2)}`;
};

const getAmountColorBySign = (sign: AmountSign): string => {
  return sign === "+" ? "text-[#16A34A]" : "text-[#DC2626]";
};

const getAbsoluteAmountFromValue = (value: string): string => {
  const absolute = Math.abs(parseSignedAmountValue(value));
  if (!Number.isFinite(absolute)) {
    return "";
  }

  return absolute > 0 ? absolute.toString() : "";
};

export const useTransactionsPageModel = (
  options: UseTransactionsPageModelOptions = {},
): UseTransactionsPageModelResult => {
  const {
    onFilterClick,
    onTransactionClick,
    uncategorizedAccountLabel = "Sin cuenta",
    uncategorizedLabel = "Sin categoría",
  } = options;

  const { items, isLoading, error, create, update, remove } = useTransactions();
  const { items: cuotas, isLoading: isCuotasLoading } = useCuotas();
  const {
    items: accounts,
    isLoading: isAccountsLoading,
    error: accountsError,
  } = useAccounts();
  const {
    items: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useCategories();

  const [editorMode, setEditorMode] = useState<TransactionsEditorMode>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<TransactionInputCurrency>("ARS");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editingAmountSign, setEditingAmountSign] = useState<AmountSign>("-");
  const [amountInput, setAmountInput] = useState<string>("");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [showSaved, setShowSaved] = useState<boolean>(false);
  const [pendingDeleteTransactionId, setPendingDeleteTransactionId] = useState<string | null>(null);
  const [deleteConfirmTransactionId, setDeleteConfirmTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (!showSaved) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSaved(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showSaved]);

  const selectedTransaction = useMemo(() => {
    if (!selectedTransactionId) {
      return null;
    }

    return items.find((item) => item.id === selectedTransactionId) ?? null;
  }, [items, selectedTransactionId]);

  const deleteConfirmTransaction = useMemo(
    () => items.find((item) => item.id === deleteConfirmTransactionId) ?? null,
    [deleteConfirmTransactionId, items],
  );

  const normalizedDescription = descriptionInput.trim();
  const amountValue = Number(amountInput);
  const isAmountValid = Number.isFinite(amountValue) && amountValue > 0;
  const isDescriptionValid = normalizedDescription.length > 0;
  const isAccountValid = selectedAccountId.trim().length > 0;
  const isFormValid = isAmountValid && isDescriptionValid && isAccountValid;

  const monthlyBalance = useMemo(() => getMonthlyBalance(items), [items]);
  const monthlyPendingInstallments = useMemo(
    () => getPendingInstallmentsTotalForMonth(cuotas),
    [cuotas],
  );
  const hasMonthlyTransactions = monthlyBalance.income > 0 || monthlyBalance.expense > 0;

  const categoriesById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.name.localeCompare(right.name)),
    [categories],
  );

  const accountsById = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((account) => {
      map.set(account.id, account.name);
    });
    return map;
  }, [accounts]);

  const sortedAccounts = useMemo(
    () => [...accounts].sort((left, right) => left.name.localeCompare(right.name)),
    [accounts],
  );

  const defaultAccountId = sortedAccounts[0]?.id ?? "";
  const isEditorOpen = editorMode !== null;

  useEffect(() => {
    if (!isEditorOpen) {
      return;
    }

    if (selectedAccountId || !defaultAccountId) {
      return;
    }

    setSelectedAccountId(defaultAccountId);
  }, [defaultAccountId, isEditorOpen, selectedAccountId]);

  const resolveCategoryLabel = (transaction: TransactionItem): string => {
    if (transaction.categoryId) {
      const categoryName = categoriesById.get(transaction.categoryId);
      if (categoryName) {
        const subcategoryName = transaction.subcategoryName?.trim();
        return subcategoryName ? `${categoryName} · ${subcategoryName}` : categoryName;
      }
    }

    return uncategorizedLabel;
  };

  const resolveAccountLabel = (transaction: TransactionItem): string => {
    return accountsById.get(transaction.accountId) ?? uncategorizedAccountLabel;
  };

  const monthGroups = useMemo<TransactionsMonthGroup[]>(() => {
    const grouped = new Map<
      string,
      { title: string; sortTime: number; total: number; transactions: TransactionItem[] }
    >();

    items.forEach((transaction) => {
      const parsedDate = getTransactionDateForMonthBalance(transaction) ?? new Date();
      const key = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
      const existing = grouped.get(key);
      const transactionAmount = parseSignedAmountValue(transaction.amount);

      if (!existing) {
        grouped.set(key, {
          title: formatMonthTitle(parsedDate),
          sortTime: parsedDate.getTime(),
          total: transactionAmount,
          transactions: [transaction],
        });
        return;
      }

      existing.total += transactionAmount;
      existing.transactions.push(transaction);
      if (parsedDate.getTime() > existing.sortTime) {
        existing.sortTime = parsedDate.getTime();
      }
    });

    return Array.from(grouped.values())
      .sort((left, right) => right.sortTime - left.sortTime)
      .map((group) => ({
        title: group.title,
        total: formatTotalAmount(group.total),
        totalColor:
          group.total < 0
            ? "text-[#DC2626]"
            : group.total > 0
              ? "text-[#16A34A]"
              : "text-black",
        transactions: [...group.transactions].sort((left, right) => {
          const leftTime = getTransactionDateForMonthBalance(left)?.getTime() ?? 0;
          const rightTime = getTransactionDateForMonthBalance(right)?.getTime() ?? 0;
          return rightTime - leftTime;
        }),
      }));
  }, [items]);

  const closeEditor = () => {
    setEditorMode(null);
    setSelectedTransactionId(null);
    setSelectedAccountId("");
    setSelectedCurrency("ARS");
    setSelectedCategoryId("");
    setEditingAmountSign("-");
    setAmountInput("");
    setDescriptionInput("");
    setShowValidation(false);
  };

  const openCreateEditor = () => {
    setEditorMode("create");
    setSelectedTransactionId(null);
    setSelectedAccountId(defaultAccountId);
    setSelectedCurrency("ARS");
    setSelectedCategoryId("");
    setEditingAmountSign("-");
    setAmountInput("");
    setDescriptionInput("");
    setShowValidation(false);
  };

  const openEditEditor = (transaction: TransactionItem) => {
    setEditorMode("edit");
    setSelectedTransactionId(transaction.id);
    setSelectedAccountId(transaction.accountId);
    setSelectedCurrency("ARS");
    setSelectedCategoryId(transaction.categoryId ?? "");
    setEditingAmountSign(parseAmountSign(transaction.amount));
    setAmountInput(getAbsoluteAmountFromValue(transaction.amount));
    setDescriptionInput(transaction.name);
    setShowValidation(false);
  };

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      closeEditor();
    } else {
      openCreateEditor();
    }

    onFilterClick?.();
  };

  const handleTransactionRowClick = (
    transaction: TransactionItem,
    monthIndex: number,
    transactionIndex: number,
  ) => {
    openEditEditor(transaction);
    onTransactionClick?.(monthIndex, transactionIndex);
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    if (!isFormValid) {
      return;
    }

    if (editorMode === "create") {
      const todayIso = new Date().toISOString().slice(0, 10);
      const dateLabel = DATE_FORMATTER.format(new Date(`${todayIso}T00:00:00`));
      const selectedCategoryName =
        (selectedCategoryId ? categoriesById.get(selectedCategoryId) : undefined) ??
        uncategorizedLabel;
      const isIncome = editingAmountSign === "+";
      const amountInArs = toArsTransactionAmount(amountValue, selectedCurrency);

      const created = await create({
        icon: isIncome ? "arrow-up-right" : "receipt",
        iconBg: isIncome ? "bg-[#16A34A]" : "bg-[#18181B]",
        name: normalizedDescription,
        accountId: selectedAccountId,
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        date: todayIso,
        createdAt: new Date().toISOString(),
        amount: formatAmountWithSign(amountInArs, editingAmountSign),
        amountColor: getAmountColorBySign(editingAmountSign),
        meta: `${todayIso} • ${dateLabel}`,
      });

      if (!created) {
        return;
      }

      closeEditor();
      return;
    }

    if (editorMode === "edit" && selectedTransactionId) {
      const selectedCategoryName =
        (selectedCategoryId ? categoriesById.get(selectedCategoryId) : undefined) ??
        uncategorizedLabel;
      const amountInArs = toArsTransactionAmount(amountValue, selectedCurrency);
      const updated = await update(selectedTransactionId, {
        name: normalizedDescription,
        accountId: selectedAccountId,
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        amount: formatAmountWithSign(amountInArs, editingAmountSign),
        amountColor: getAmountColorBySign(editingAmountSign),
      });

      if (!updated) {
        return;
      }

      closeEditor();
      setShowSaved(true);
    }
  };

  const requestDeleteTransaction = (id: string): void => {
    if (!id || pendingDeleteTransactionId) {
      return;
    }

    const exists = items.some((item) => item.id === id);
    if (!exists) {
      return;
    }

    setDeleteConfirmTransactionId(id);
  };

  const cancelDeleteTransaction = (): void => {
    if (pendingDeleteTransactionId) {
      return;
    }

    setDeleteConfirmTransactionId(null);
  };

  const confirmDeleteTransaction = async (): Promise<void> => {
    if (!deleteConfirmTransactionId || pendingDeleteTransactionId === deleteConfirmTransactionId) {
      return;
    }

    setPendingDeleteTransactionId(deleteConfirmTransactionId);
    const removed = await remove(deleteConfirmTransactionId);
    if (!removed) {
      setPendingDeleteTransactionId((current) => (
        current === deleteConfirmTransactionId ? null : current
      ));
      return;
    }

    if (selectedTransactionId === deleteConfirmTransactionId) {
      closeEditor();
    }

    setDeleteConfirmTransactionId(null);
    setPendingDeleteTransactionId((current) => (
      current === deleteConfirmTransactionId ? null : current
    ));
  };

  return {
    accountsError,
    amountInput,
    cancelDeleteTransaction,
    categoriesError,
    confirmDeleteTransaction,
    deleteConfirmTransactionName: deleteConfirmTransaction?.name ?? "",
    descriptionInput,
    editorMode,
    editingAmountSign,
    error,
    handleHeaderAction,
    handleSubmit,
    handleTransactionRowClick,
    hasMonthlyTransactions,
    isAccountValid,
    isAccountsLoading,
    isAmountValid,
    isCategoriesLoading,
    isCuotasLoading,
    isDeleteConfirmOpen: deleteConfirmTransactionId !== null,
    isDescriptionValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    itemsCount: items.length,
    monthGroups,
    cuotasCount: cuotas.length,
    monthlyBalance,
    monthlyPendingInstallments,
    pendingDeleteTransactionId,
    requestDeleteTransaction,
    selectedAccountId,
    selectedCurrency,
    selectedCategoryId,
    selectedTransaction,
    setAmountInput,
    setDescriptionInput,
    setEditingAmountSign,
    setSelectedAccountId,
    setSelectedCurrency,
    setSelectedCategoryId,
    showSaved,
    showValidation,
    sortedAccounts,
    sortedCategories,
    resolveAccountLabel,
    resolveCategoryLabel,
  };
};
