import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TRANSACTION_EXPENSE_TEXT_CLASS,
  TRANSACTION_INCOME_TEXT_CLASS,
} from "@/constants";
import { useCurrency } from "./useCurrency";
import { useAccounts } from "./useAccounts";
import { useCategories } from "./useCategories";
import { useCuotas } from "./useCuotas";
import { useTransactions } from "./useTransactions";
import {
  formatCurrency,
  getMonthlyBalance,
  getPendingInstallmentsTotalForMonth,
  getTransactionDateForMonthBalance,
  toArsTransactionAmount,
  type TransactionItem,
  type TransactionInputCurrency,
} from "@/utils";

export interface TransactionsMonthGroup {
  key: string;
  title: string;
  total: string;
  totalColor: string;
  transactions: TransactionItem[];
}

export type AmountSign = "+" | "-";
export type TransactionsEditorMode = "create" | "edit" | null;

export interface UseTransactionsPageModelOptions {
  descriptionFallbackLabel?: string;
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
  handleCloseEditor: () => void;
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
  isCategoryValid: boolean;
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
  selectedSubcategoryName: string;
  selectedTransaction: TransactionItem | null;
  setAmountInput: (value: string) => void;
  setDescriptionInput: (value: string) => void;
  setEditingAmountSign: (value: AmountSign) => void;
  setSelectedAccountId: (value: string) => void;
  setSelectedCurrency: (value: TransactionInputCurrency) => void;
  setSelectedCategoryId: (value: string) => void;
  setSelectedSubcategoryName: (value: string) => void;
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

const formatTotalAmount = (value: number, currency: TransactionInputCurrency): string => {
  const absolute = formatCurrency(Math.abs(value), { currency });
  if (value < 0) {
    return `-${absolute}`;
  }

  if (value > 0) {
    return `+${absolute}`;
  }

  return absolute;
};

const formatAmountWithSign = (value: number, sign: AmountSign): string => {
  return `${sign}$${value.toFixed(2)}`;
};

const getAmountColorBySign = (sign: AmountSign): string => {
  return sign === "+" ? TRANSACTION_INCOME_TEXT_CLASS : TRANSACTION_EXPENSE_TEXT_CLASS;
};

const normalizeCategoryMatcher = (value: string | undefined): string => {
  return (value ?? "").trim().toLocaleLowerCase("es-ES");
};

const isIncomeCategory = (category: { id?: string; name: string }): boolean => {
  const normalizedName = normalizeCategoryMatcher(category.name);
  const normalizedId = normalizeCategoryMatcher(category.id);

  return (
    normalizedName === "ingreso" ||
    normalizedName === "ingresos" ||
    normalizedName.includes("ingreso") ||
    normalizedId.includes("income")
  );
};

const getAbsoluteAmountFromValue = (value: string): string => {
  const absolute = Math.abs(parseSignedAmountValue(value));
  if (!Number.isFinite(absolute)) {
    return "";
  }

  return absolute > 0 ? absolute.toString() : "";
};

const dedupeTransactionsById = (items: TransactionItem[]): TransactionItem[] => {
  const seen = new Set<string>();
  const unique: TransactionItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    unique.push(item);
  }

  return unique;
};

export const useTransactionsPageModel = (
  options: UseTransactionsPageModelOptions = {},
): UseTransactionsPageModelResult => {
  const {
    descriptionFallbackLabel = "Sin descripción",
    onFilterClick,
    onTransactionClick,
    uncategorizedAccountLabel = "Sin cuenta",
    uncategorizedLabel = "Sin categoría",
  } = options;
  const { currency: appCurrency } = useCurrency();

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
  const [selectedCurrency, setSelectedCurrency] = useState<TransactionInputCurrency>(appCurrency);
  const [selectedCategoryId, setSelectedCategoryIdState] = useState<string>("");
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string>("");
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
  const resolvedDescription = normalizedDescription || descriptionFallbackLabel;
  const amountValue = Number(amountInput);
  const isAmountValid = Number.isFinite(amountValue) && amountValue > 0;
  const isDescriptionValid = true;
  const isAccountValid = selectedAccountId.trim().length > 0;
  const isCategoryValid = selectedCategoryId.trim().length > 0;
  const isFormValid = isAmountValid && isDescriptionValid && isAccountValid && isCategoryValid;

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

  const categoryIconById = useMemo(() => {
    const map = new Map<string, { icon: string; iconBg: string }>();
    categories.forEach((category) => {
      map.set(category.id, { icon: category.icon, iconBg: category.iconBg });
    });
    return map;
  }, [categories]);

  const sortedCategories = useMemo(() => {
    const ordered = [...categories].sort((left, right) => left.name.localeCompare(right.name));
    if (editingAmountSign !== "+") {
      return ordered;
    }

    return ordered.filter((category) => isIncomeCategory(category));
  }, [categories, editingAmountSign]);

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

    if (!selectedAccountId) {
      return;
    }

    const accountExists = sortedAccounts.some((account) => account.id === selectedAccountId);
    if (!accountExists) {
      setSelectedAccountId("");
    }
  }, [isEditorOpen, selectedAccountId, sortedAccounts]);

  useEffect(() => {
    if (!isEditorOpen) {
      return;
    }

    if (selectedCategoryId) {
      const selectedCategory = sortedCategories.find((category) => category.id === selectedCategoryId);
      if (!selectedCategory) {
        setSelectedCategoryIdState("");
        setSelectedSubcategoryName("");
        return;
      }

      if (selectedSubcategoryName.trim().length > 0) {
        const availableSubcategories = Array.isArray(selectedCategory.subcategories)
          ? selectedCategory.subcategories.map((value) => value.trim()).filter((value) => value.length > 0)
          : [];
        const subcategoryStillExists = availableSubcategories.some(
          (subcategory) => subcategory === selectedSubcategoryName,
        );
        if (!subcategoryStillExists) {
          setSelectedSubcategoryName("");
        }
      }
    } else if (selectedSubcategoryName.trim().length > 0) {
      setSelectedSubcategoryName("");
    }
  }, [
    isEditorOpen,
    selectedCategoryId,
    selectedSubcategoryName,
    sortedCategories,
  ]);

  const resolveCategoryLabel = useCallback((transaction: TransactionItem): string => {
    if (transaction.categoryId) {
      const categoryName = categoriesById.get(transaction.categoryId);
      if (categoryName) {
        const subcategoryName = transaction.subcategoryName?.trim();
        return subcategoryName ? `${categoryName} · ${subcategoryName}` : categoryName;
      }
    }

    return uncategorizedLabel;
  }, [categoriesById, uncategorizedLabel]);

  const resolveAccountLabel = useCallback((transaction: TransactionItem): string => {
    return accountsById.get(transaction.accountId) ?? uncategorizedAccountLabel;
  }, [accountsById, uncategorizedAccountLabel]);

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
        key: `${new Date(group.sortTime).getFullYear()}-${String(new Date(group.sortTime).getMonth() + 1).padStart(2, "0")}`,
        title: group.title,
        total: formatTotalAmount(group.total, appCurrency),
        totalColor:
          group.total < 0
            ? TRANSACTION_EXPENSE_TEXT_CLASS
            : group.total > 0
              ? TRANSACTION_INCOME_TEXT_CLASS
              : "text-[var(--text-primary)]",
        transactions: dedupeTransactionsById(group.transactions)
          .sort((left, right) => {
            const leftTime = getTransactionDateForMonthBalance(left)?.getTime() ?? 0;
            const rightTime = getTransactionDateForMonthBalance(right)?.getTime() ?? 0;
            return rightTime - leftTime;
          })
          .map((tx) => {
            const catIcon = tx.categoryId ? categoryIconById.get(tx.categoryId) : undefined;
            if (!catIcon) return tx;
            return { ...tx, icon: catIcon.icon, iconBg: catIcon.iconBg };
          }),
      }));
  }, [appCurrency, items, categoryIconById]);

  const closeEditor = useCallback(() => {
    setEditorMode(null);
    setSelectedTransactionId(null);
    setSelectedAccountId("");
    setSelectedCurrency(appCurrency);
    setSelectedCategoryIdState("");
    setSelectedSubcategoryName("");
    setEditingAmountSign("-");
    setAmountInput("");
    setDescriptionInput("");
    setShowValidation(false);
  }, [appCurrency]);

  const openCreateEditor = useCallback(() => {
    setEditorMode("create");
    setSelectedTransactionId(null);
    setSelectedAccountId(defaultAccountId);
    setSelectedCurrency(appCurrency);
    setSelectedCategoryIdState("");
    setSelectedSubcategoryName("");
    setEditingAmountSign("-");
    setAmountInput("");
    setDescriptionInput("");
    setShowValidation(false);
  }, [appCurrency, defaultAccountId]);

  const openEditEditor = useCallback((transaction: TransactionItem) => {
    setEditorMode("edit");
    setSelectedTransactionId(transaction.id);
    setSelectedAccountId(transaction.accountId);
    setSelectedCurrency(appCurrency);
    setSelectedCategoryIdState(transaction.categoryId ?? "");
    setSelectedSubcategoryName(transaction.subcategoryName ?? "");
    setEditingAmountSign(parseAmountSign(transaction.amount));
    setAmountInput(getAbsoluteAmountFromValue(transaction.amount));
    setDescriptionInput(transaction.name);
    setShowValidation(false);
  }, [appCurrency]);

  const handleHeaderAction = useCallback(() => {
    if (isEditorOpen) {
      closeEditor();
    } else {
      openCreateEditor();
    }

    onFilterClick?.();
  }, [isEditorOpen, closeEditor, openCreateEditor, onFilterClick]);

  const handleTransactionRowClick = useCallback((
    transaction: TransactionItem,
    monthIndex: number,
    transactionIndex: number,
  ) => {
    openEditEditor(transaction);
    onTransactionClick?.(monthIndex, transactionIndex);
  }, [openEditEditor, onTransactionClick]);

  const handleSubmit = useCallback(async () => {
    setShowValidation(true);

    if (!isFormValid) {
      return;
    }

    const selectedCategoryName = selectedCategoryId
      ? categoriesById.get(selectedCategoryId)
      : undefined;
    if (!selectedCategoryName) {
      return;
    }

    if (editorMode === "create") {
      const todayIso = new Date().toISOString().slice(0, 10);
      const dateLabel = DATE_FORMATTER.format(new Date(`${todayIso}T00:00:00`));
      const isIncome = editingAmountSign === "+";
      const amountInArs = toArsTransactionAmount(amountValue, selectedCurrency);
      const selectedCategoryMeta = categoryIconById.get(selectedCategoryId);

      const created = await create({
        icon: selectedCategoryMeta?.icon ?? (isIncome ? "arrow-up-right" : "receipt"),
        iconBg: selectedCategoryMeta?.iconBg ?? (isIncome ? "bg-[#16A34A]" : "bg-[#18181B]"),
        name: resolvedDescription,
        accountId: selectedAccountId,
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        subcategoryName: selectedSubcategoryName || undefined,
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
      const amountInArs = toArsTransactionAmount(amountValue, selectedCurrency);
      const selectedCategoryMeta = categoryIconById.get(selectedCategoryId);
      const updated = await update(selectedTransactionId, {
        name: resolvedDescription,
        accountId: selectedAccountId,
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        subcategoryName: selectedSubcategoryName || undefined,
        amount: formatAmountWithSign(amountInArs, editingAmountSign),
        amountColor: getAmountColorBySign(editingAmountSign),
        ...(selectedCategoryMeta && {
          icon: selectedCategoryMeta.icon,
          iconBg: selectedCategoryMeta.iconBg,
        }),
      });

      if (!updated) {
        return;
      }

      closeEditor();
      setShowSaved(true);
    }
  }, [
    isFormValid,
    editorMode,
    selectedCategoryId,
    categoriesById,
    categoryIconById,
    editingAmountSign,
    amountValue,
    selectedCurrency,
    selectedAccountId,
    selectedSubcategoryName,
    resolvedDescription,
    selectedTransactionId,
    create,
    update,
    closeEditor,
  ]);

  const setSelectedCategoryId = useCallback((value: string) => {
    setSelectedCategoryIdState(value);
    setSelectedSubcategoryName("");
  }, []);

  const requestDeleteTransaction = useCallback((id: string): void => {
    if (!id || pendingDeleteTransactionId) {
      return;
    }

    const exists = items.some((item) => item.id === id);
    if (!exists) {
      return;
    }

    setDeleteConfirmTransactionId(id);
  }, [pendingDeleteTransactionId, items]);

  const cancelDeleteTransaction = useCallback((): void => {
    if (pendingDeleteTransactionId) {
      return;
    }

    setDeleteConfirmTransactionId(null);
  }, [pendingDeleteTransactionId]);

  const confirmDeleteTransaction = useCallback(async (): Promise<void> => {
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
  }, [deleteConfirmTransactionId, pendingDeleteTransactionId, remove, selectedTransactionId, closeEditor]);

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
    handleCloseEditor: closeEditor,
    handleHeaderAction,
    handleSubmit,
    handleTransactionRowClick,
    hasMonthlyTransactions,
    isAccountValid,
    isAccountsLoading,
    isAmountValid,
    isCategoriesLoading,
    isCategoryValid,
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
    selectedSubcategoryName,
    selectedTransaction,
    setAmountInput,
    setDescriptionInput,
    setEditingAmountSign,
    setSelectedAccountId,
    setSelectedCurrency,
    setSelectedCategoryId,
    setSelectedSubcategoryName,
    showSaved,
    showValidation,
    sortedAccounts,
    sortedCategories,
    resolveAccountLabel,
    resolveCategoryLabel,
  };
};
