import {
  PageHeader,
  TransactionEditorWidget,
  TransactionsMonthListWidget,
  TransactionsMonthlyBalanceWidget,
  useTransactionsPageModel,
} from "@/modules/transactions";

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
  const {
    accountsError,
    amountInput,
    categoriesError,
    cuotasCount,
    descriptionInput,
    editorMode,
    editingAmountSign,
    error,
    handleDelete,
    handleHeaderAction,
    handleSubmit,
    handleTransactionRowClick,
    hasMonthlyTransactions,
    isAccountValid,
    isAccountsLoading,
    isAmountValid,
    isCategoriesLoading,
    isCuotasLoading,
    isDescriptionValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    itemsCount,
    monthGroups,
    monthlyBalance,
    monthlyPendingInstallments,
    selectedAccountId,
    selectedCategoryId,
    selectedTransaction,
    setAmountInput,
    setDescriptionInput,
    setEditingAmountSign,
    setSelectedAccountId,
    setSelectedCategoryId,
    setShowDeleteConfirm,
    showDeleteConfirm,
    showSaved,
    showValidation,
    sortedAccounts,
    sortedCategories,
    resolveAccountLabel,
    resolveCategoryLabel,
  } = useTransactionsPageModel({
    onFilterClick,
    onTransactionClick,
    uncategorizedLabel,
    uncategorizedAccountLabel,
  });

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

          <TransactionsMonthlyBalanceWidget
            isLoading={isLoading}
            itemsCount={itemsCount}
            monthlyBalanceTitle={monthlyBalanceTitle}
            monthlyLoadingLabel={monthlyLoadingLabel}
            monthlyNetLabel={monthlyNetLabel}
            monthlyIncomeLabel={monthlyIncomeLabel}
            monthlyExpenseLabel={monthlyExpenseLabel}
            monthlyPendingInstallmentsLabel={monthlyPendingInstallmentsLabel}
            monthlyPendingInstallmentsLoadingLabel={monthlyPendingInstallmentsLoadingLabel}
            monthlyEmptyHint={monthlyEmptyHint}
            monthlyBalance={monthlyBalance}
            monthlyPendingInstallments={monthlyPendingInstallments}
            hasMonthlyTransactions={hasMonthlyTransactions}
            isCuotasLoading={isCuotasLoading}
            cuotasCount={cuotasCount}
          />

          <TransactionEditorWidget
            isOpen={isEditorOpen}
            editorMode={editorMode}
            quickAddTitle={quickAddTitle}
            editTitle={editTitle}
            quickAddTypeLabel={quickAddTypeLabel}
            quickAddExpenseLabel={quickAddExpenseLabel}
            quickAddIncomeLabel={quickAddIncomeLabel}
            quickAddAmountLabel={quickAddAmountLabel}
            quickAddAmountPlaceholder={quickAddAmountPlaceholder}
            quickAddAmountErrorLabel={quickAddAmountErrorLabel}
            quickAddDescriptionLabel={quickAddDescriptionLabel}
            quickAddDescriptionPlaceholder={quickAddDescriptionPlaceholder}
            quickAddDescriptionErrorLabel={quickAddDescriptionErrorLabel}
            quickAddAccountLabel={quickAddAccountLabel}
            quickAddAccountErrorLabel={quickAddAccountErrorLabel}
            quickAddCategoryLabel={quickAddCategoryLabel}
            quickAddSubmitLabel={quickAddSubmitLabel}
            editSubmitLabel={editSubmitLabel}
            deleteActionLabel={deleteActionLabel}
            deleteConfirmTitle={deleteConfirmTitle}
            deleteConfirmHint={deleteConfirmHint}
            deleteCancelLabel={deleteCancelLabel}
            deleteConfirmLabel={deleteConfirmLabel}
            uncategorizedLabel={uncategorizedLabel}
            uncategorizedAccountLabel={uncategorizedAccountLabel}
            noAccountsLabel={noAccountsLabel}
            amountInput={amountInput}
            descriptionInput={descriptionInput}
            selectedAccountId={selectedAccountId}
            selectedCategoryId={selectedCategoryId}
            editingAmountSign={editingAmountSign}
            showValidation={showValidation}
            showDeleteConfirm={showDeleteConfirm}
            isAmountValid={isAmountValid}
            isDescriptionValid={isDescriptionValid}
            isAccountValid={isAccountValid}
            isFormValid={isFormValid}
            isLoading={isLoading}
            isAccountsLoading={isAccountsLoading}
            isCategoriesLoading={isCategoriesLoading}
            accountsError={accountsError}
            categoriesError={categoriesError}
            sortedAccounts={sortedAccounts}
            sortedCategories={sortedCategories}
            selectedTransaction={selectedTransaction}
            isSelectedTransactionAvailable={Boolean(selectedTransaction)}
            onAmountChange={setAmountInput}
            onDescriptionChange={setDescriptionInput}
            onSelectedAccountIdChange={setSelectedAccountId}
            onSelectedCategoryIdChange={setSelectedCategoryId}
            onSignChange={setEditingAmountSign}
            onToggleDeleteConfirm={setShowDeleteConfirm}
            onSubmit={() => {
              void handleSubmit();
            }}
            onDelete={() => {
              void handleDelete();
            }}
          />

          <TransactionsMonthListWidget
            monthGroups={monthGroups}
            isLoading={isLoading}
            hasError={Boolean(error)}
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            editActionLabel={editActionLabel}
            resolveAccountLabel={resolveAccountLabel}
            resolveCategoryLabel={resolveCategoryLabel}
            onTransactionClick={handleTransactionRowClick}
          />
        </div>
      </div>
    </div>
  );
}
