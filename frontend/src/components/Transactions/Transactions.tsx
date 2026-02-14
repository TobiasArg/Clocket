import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  CardSection,
  IconBadge,
  ListItemRow,
  PageHeader,
  PhosphorIcon,
} from "@/components";
import { useAccounts, useCategories, useCuotas, useTransactions } from "@/hooks";
import {
  formatCurrency,
  getPendingInstallmentsTotalForMonth,
  getMonthlyBalance,
  getTransactionDateForMonthBalance,
  type TransactionItem,
} from "@/utils";

export interface TransactionsProps {
  headerTitle?: string;
  quickAddTitle?: string;
  quickAddTypeLabel?: string;
  quickAddExpenseLabel?: string;
  quickAddIncomeLabel?: string;
  quickAddAmountLabel?: string;
  quickAddDescriptionLabel?: string;
  quickAddAccountLabel?: string;
  quickAddCategoryLabel?: string;
  quickAddAmountPlaceholder?: string;
  quickAddDescriptionPlaceholder?: string;
  quickAddSubmitLabel?: string;
  editTitle?: string;
  editSubmitLabel?: string;
  editActionLabel?: string;
  deleteActionLabel?: string;
  deleteConfirmTitle?: string;
  deleteConfirmHint?: string;
  deleteCancelLabel?: string;
  deleteConfirmLabel?: string;
  quickAddAmountErrorLabel?: string;
  quickAddDescriptionErrorLabel?: string;
  quickAddAccountErrorLabel?: string;
  savedLabel?: string;
  monthlyBalanceTitle?: string;
  monthlyNetLabel?: string;
  monthlyIncomeLabel?: string;
  monthlyExpenseLabel?: string;
  monthlyPendingInstallmentsLabel?: string;
  monthlyPendingInstallmentsLoadingLabel?: string;
  monthlyEmptyHint?: string;
  monthlyLoadingLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  uncategorizedLabel?: string;
  uncategorizedAccountLabel?: string;
  noAccountsLabel?: string;
  onBackClick?: () => void;
  onFilterClick?: () => void;
  onTransactionClick?: (monthIndex: number, txIndex: number) => void;
}

interface TransactionsMonthGroup {
  title: string;
  total: string;
  totalColor: string;
  transactions: TransactionItem[];
}

type EditorMode = "create" | "edit" | null;

type AmountSign = "+" | "-";

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

const parseTransactionDate = (transaction: TransactionItem): Date | null => {
  return getTransactionDateForMonthBalance(transaction);
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

export function Transactions({
  headerTitle = "Transacciones",
  quickAddTitle = "Quick Add",
  quickAddTypeLabel = "Tipo",
  quickAddExpenseLabel = "Egreso",
  quickAddIncomeLabel = "Ingreso",
  quickAddAmountLabel = "Monto",
  quickAddDescriptionLabel = "Descripción",
  quickAddAccountLabel = "Cuenta",
  quickAddCategoryLabel = "Categoría",
  quickAddAmountPlaceholder = "0.00",
  quickAddDescriptionPlaceholder = "Ej. Café, Uber, supermercado",
  quickAddSubmitLabel = "Agregar transacción",
  editTitle = "Editar transacción",
  editSubmitLabel = "Guardar cambios",
  editActionLabel = "Editar",
  deleteActionLabel = "Delete",
  deleteConfirmTitle = "Delete this transaction?",
  deleteConfirmHint = "This can’t be undone.",
  deleteCancelLabel = "Cancel",
  deleteConfirmLabel = "Delete",
  quickAddAmountErrorLabel = "Ingresa un monto mayor a 0.",
  quickAddDescriptionErrorLabel = "Agrega una descripción corta.",
  quickAddAccountErrorLabel = "Selecciona una cuenta.",
  savedLabel = "Saved",
  monthlyBalanceTitle = "Balance mensual",
  monthlyNetLabel = "Neto",
  monthlyIncomeLabel = "Ingresos",
  monthlyExpenseLabel = "Gastos",
  monthlyPendingInstallmentsLabel = "Pending installments this month",
  monthlyPendingInstallmentsLoadingLabel = "Calculating installments...",
  monthlyEmptyHint = "No transactions yet",
  monthlyLoadingLabel = "Calculando balance...",
  loadingLabel = "Cargando transacciones...",
  emptyTitle = "No hay transacciones todavía",
  emptyHint = "Agrega tu primera transacción para empezar.",
  errorLabel = "No pudimos cargar las transacciones. Intenta nuevamente.",
  uncategorizedLabel = "Uncategorized",
  uncategorizedAccountLabel = "Sin cuenta",
  noAccountsLabel = "Crea una cuenta en Más > Cuentas para registrar transacciones.",
  onBackClick,
  onFilterClick,
  onTransactionClick,
}: TransactionsProps) {
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
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editingAmountSign, setEditingAmountSign] = useState<AmountSign>("-");
  const [amountInput, setAmountInput] = useState<string>("");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showSaved, setShowSaved] = useState<boolean>(false);

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
        return categoryName;
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
      const parsedDate = parseTransactionDate(transaction) ?? new Date();
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
          const leftTime = parseTransactionDate(left)?.getTime() ?? 0;
          const rightTime = parseTransactionDate(right)?.getTime() ?? 0;
          return rightTime - leftTime;
        }),
      }));
  }, [items]);

  const closeEditor = () => {
    setEditorMode(null);
    setSelectedTransactionId(null);
    setSelectedAccountId("");
    setSelectedCategoryId("");
    setEditingAmountSign("-");
    setAmountInput("");
    setDescriptionInput("");
    setShowValidation(false);
    setShowDeleteConfirm(false);
  };

  const openCreateEditor = () => {
    setEditorMode("create");
    setSelectedTransactionId(null);
    setSelectedAccountId(defaultAccountId);
    setSelectedCategoryId("");
    setEditingAmountSign("-");
    setAmountInput("");
    setDescriptionInput("");
    setShowValidation(false);
    setShowDeleteConfirm(false);
  };

  const openEditEditor = (transaction: TransactionItem) => {
    setEditorMode("edit");
    setSelectedTransactionId(transaction.id);
    setSelectedAccountId(transaction.accountId);
    setSelectedCategoryId(transaction.categoryId ?? "");
    setEditingAmountSign(parseAmountSign(transaction.amount));
    setAmountInput(getAbsoluteAmountFromValue(transaction.amount));
    setDescriptionInput(transaction.name);
    setShowValidation(false);
    setShowDeleteConfirm(false);
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

      const created = await create({
        icon: isIncome ? "arrow-up-right" : "receipt",
        iconBg: isIncome ? "bg-[#16A34A]" : "bg-[#18181B]",
        name: normalizedDescription,
        accountId: selectedAccountId,
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        date: todayIso,
        createdAt: new Date().toISOString(),
        amount: formatAmountWithSign(amountValue, editingAmountSign),
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
      const updated = await update(selectedTransactionId, {
        name: normalizedDescription,
        accountId: selectedAccountId,
        category: selectedCategoryName,
        categoryId: selectedCategoryId || undefined,
        amount: formatAmountWithSign(amountValue, editingAmountSign),
        amountColor: getAmountColorBySign(editingAmountSign),
      });

      if (!updated) {
        return;
      }

      closeEditor();
      setShowSaved(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedTransactionId) {
      return;
    }

    const removed = await remove(selectedTransactionId);
    if (!removed) {
      return;
    }

    closeEditor();
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto px-5 py-2">
        <div className="flex flex-col gap-6">
          {showSaved && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-2">
              <span className="text-xs font-medium text-[#71717A]">{savedLabel}</span>
            </div>
          )}

          <CardSection gap="gap-2">
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4 flex flex-col gap-3">
              <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
                {monthlyBalanceTitle}
              </span>

              {isLoading && items.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#71717A]">{monthlyLoadingLabel}</span>
                  <div className="animate-pulse h-8 rounded-xl bg-white" />
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs font-medium text-[#71717A]">{monthlyNetLabel}</span>
                    <span className="block max-w-full truncate text-[clamp(1.5rem,8vw,2rem)] font-bold text-black font-['Outfit'] leading-none">
                      {formatCurrency(monthlyBalance.net)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white px-3 py-2">
                      <span className="block text-[11px] font-medium text-[#71717A]">
                        {monthlyIncomeLabel}
                      </span>
                      <span className="block max-w-full truncate text-sm font-semibold text-[#52525B]">
                        {formatCurrency(monthlyBalance.income)}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      <span className="block text-[11px] font-medium text-[#71717A]">
                        {monthlyExpenseLabel}
                      </span>
                      <span className="block max-w-full truncate text-sm font-semibold text-[#52525B]">
                        {formatCurrency(monthlyBalance.expense)}
                      </span>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#71717A]">
                      {monthlyPendingInstallmentsLabel}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-[#52525B]">
                      {isCuotasLoading && cuotas.length === 0
                        ? monthlyPendingInstallmentsLoadingLabel
                        : formatCurrency(monthlyPendingInstallments)}
                    </span>
                  </div>

                  {!hasMonthlyTransactions && (
                    <span className="text-xs font-medium text-[#71717A]">{monthlyEmptyHint}</span>
                  )}
                </>
              )}
            </div>
          </CardSection>

          {isEditorOpen && (
          <div className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
              {editorMode === "create" ? quickAddTitle : editTitle}
            </span>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">{quickAddTypeLabel}</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAmountSign("-")}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    editingAmountSign === "-"
                      ? "bg-black text-white"
                      : "bg-white text-[#52525B]"
                  }`}
                >
                  {quickAddExpenseLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAmountSign("+")}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    editingAmountSign === "+"
                      ? "bg-black text-white"
                      : "bg-white text-[#52525B]"
                  }`}
                >
                  {quickAddIncomeLabel}
                </button>
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">{quickAddAmountLabel}</span>
              <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  placeholder={quickAddAmountPlaceholder}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isAmountValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {quickAddAmountErrorLabel}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddDescriptionLabel}</span>
                <input
                  type="text"
                  value={descriptionInput}
                  onChange={(event) => setDescriptionInput(event.target.value)}
                  placeholder={quickAddDescriptionPlaceholder}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isDescriptionValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {quickAddDescriptionErrorLabel}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddAccountLabel}</span>
                <select
                  value={selectedAccountId}
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                >
                  <option value="">{uncategorizedAccountLabel}</option>
                  {sortedAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {showValidation && !isAccountValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {quickAddAccountErrorLabel}
                  </span>
                )}
                {isAccountsLoading && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    Cargando cuentas...
                  </span>
                )}
                {accountsError && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    No pudimos cargar las cuentas.
                  </span>
                )}
                {!isAccountsLoading && sortedAccounts.length === 0 && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {noAccountsLabel}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddCategoryLabel}</span>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                >
                  <option value="">{uncategorizedLabel}</option>
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {isCategoriesLoading && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    Cargando categorías...
                  </span>
                )}
                {categoriesError && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    No pudimos cargar las categorías.
                  </span>
                )}
              </label>

              <ActionButton
                icon={editorMode === "create" ? "plus" : "check"}
                label={editorMode === "create" ? quickAddSubmitLabel : editSubmitLabel}
                iconColor="text-white"
                labelColor="text-white"
                bg={isFormValid && !isLoading ? "bg-black" : "bg-[#A1A1AA]"}
                padding="px-4 py-3"
                className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
                onClick={() => {
                  void handleSubmit();
                }}
              />

              {editorMode === "edit" && selectedTransaction && (
                <div className="flex flex-col gap-2">
                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-fit text-xs font-medium text-[#71717A]"
                    >
                      {deleteActionLabel}
                    </button>
                  )}

                  {showDeleteConfirm && (
                    <div className="rounded-xl bg-white px-3 py-3 flex flex-col gap-2">
                      <span className="text-xs font-semibold text-black">{deleteConfirmTitle}</span>
                      <span className="text-xs font-medium text-[#71717A]">{deleteConfirmHint}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-[#F4F4F5] text-xs font-medium text-[#52525B]"
                        >
                          {deleteCancelLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDelete();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-black text-xs font-medium text-white"
                        >
                          {deleteConfirmLabel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isLoading && items.length === 0 && (
            <CardSection
              title={loadingLabel}
              titleClassName="text-sm font-semibold text-[#71717A]"
              gap="gap-3"
            >
              <div className="animate-pulse h-[68px] rounded-2xl bg-[#F4F4F5]" />
              <div className="animate-pulse h-[68px] rounded-2xl bg-[#F4F4F5]" />
            </CardSection>
          )}

          {!isLoading && error && (
            <CardSection gap="gap-2">
              <div className="rounded-2xl bg-[#F4F4F5] px-4 py-3">
                <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
              </div>
            </CardSection>
          )}

          {!isLoading && !error && monthGroups.length === 0 && (
            <CardSection gap="gap-2">
              <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
                <span className="block text-sm font-semibold text-black font-['Outfit']">
                  {emptyTitle}
                </span>
                <span className="block text-xs font-medium text-[#71717A] mt-1">
                  {emptyHint}
                </span>
              </div>
            </CardSection>
          )}

          {!error &&
            monthGroups.map((month, monthIndex) => (
              <CardSection
                key={month.title}
                title={month.title}
                titleClassName="text-lg font-bold text-black font-['Outfit']"
                action={
                  <span className={`text-base font-semibold font-['Outfit'] ${month.totalColor}`}>
                    {month.total}
                  </span>
                }
                gap="gap-3"
              >
                {month.transactions.map((transaction, transactionIndex) => (
                  <ListItemRow
                    key={transaction.id}
                    left={<IconBadge icon={transaction.icon} bg={transaction.iconBg} />}
                    title={transaction.name}
                    subtitle={`${resolveAccountLabel(transaction)} · ${resolveCategoryLabel(transaction)}`}
                    titleClassName="text-[15px] font-semibold text-black font-['Outfit']"
                    subtitleClassName="text-[11px] font-medium text-[#71717A] truncate"
                    right={
                      <div className="flex flex-col gap-0.5 items-end shrink-0">
                        <span
                          className={`text-[15px] font-bold font-['Outfit'] ${
                            parseAmountSign(transaction.amount) === "+"
                              ? "text-[#16A34A]"
                              : "text-[#DC2626]"
                          }`}
                        >
                          {transaction.amount}
                        </span>
                        <span className="block max-w-[132px] truncate text-[10px] font-medium text-[#A1A1AA]">
                          {transaction.meta}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-[#71717A]">
                          <PhosphorIcon name="pencil-simple" size="text-[10px]" className="text-[#71717A]" />
                          <span>{editActionLabel}</span>
                        </div>
                      </div>
                    }
                    onClick={() =>
                      handleTransactionRowClick(
                        transaction,
                        monthIndex,
                        transactionIndex,
                      )
                    }
                    showBorder={transactionIndex < month.transactions.length - 1}
                    padding="py-3.5"
                  />
                ))}
              </CardSection>
            ))}
        </div>
      </div>
    </div>
  );
}
