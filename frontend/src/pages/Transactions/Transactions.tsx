import {
  PageHeader,
  TransactionDeleteConfirmDialog,
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
  quickAddCurrencyLabel?: string;
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
  quickAddCurrencyLabel = "Moneda",
  quickAddCategoryLabel = "Categoría",
  quickAddAmountPlaceholder = "0.00",
  quickAddDescriptionPlaceholder = "Ej. Café, Uber, supermercado",
  quickAddSubmitLabel = "Agregar transacción",
  editTitle = "Editar transacción",
  editSubmitLabel = "Guardar cambios",
  editActionLabel = "Editar",
  deleteActionLabel = "Eliminar",
  deleteConfirmTitle = "¿Eliminar esta transacción?",
  deleteConfirmHint = "No se puede deshacer.",
  deleteCancelLabel = "Cancelar",
  deleteConfirmLabel = "Eliminar",
  quickAddAmountErrorLabel = "Ingresa un monto mayor a 0.",
  quickAddDescriptionErrorLabel = "Agrega una descripción corta.",
  quickAddAccountErrorLabel = "Selecciona una cuenta.",
  savedLabel = "Guardado",
  monthlyBalanceTitle = "Balance mensual",
  monthlyNetLabel = "Neto",
  monthlyIncomeLabel = "Ingresos",
  monthlyExpenseLabel = "Gastos",
  monthlyPendingInstallmentsLabel = "Cuotas pendientes este mes",
  monthlyPendingInstallmentsLoadingLabel = "Calculando cuotas...",
  monthlyEmptyHint = "Aún no hay transacciones",
  monthlyLoadingLabel = "Calculando balance...",
  loadingLabel = "Cargando transacciones...",
  emptyTitle = "No hay transacciones todavía",
  emptyHint = "Agrega tu primera transacción para empezar.",
  errorLabel = "No pudimos cargar las transacciones. Intenta nuevamente.",
  uncategorizedLabel = "Sin categoría",
  uncategorizedAccountLabel = "Sin cuenta",
  noAccountsLabel = "Crea una cuenta en Más > Cuentas para registrar transacciones.",
  onBackClick,
  onFilterClick,
  onTransactionClick,
}: TransactionsProps) {
  const {
    accountsError,
    amountInput,
    cancelDeleteTransaction,
    categoriesError,
    confirmDeleteTransaction,
    deleteConfirmTransactionName,
    cuotasCount,
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
    isDescriptionValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    itemsCount,
    monthGroups,
    monthlyBalance,
    monthlyPendingInstallments,
    pendingDeleteTransactionId,
    requestDeleteTransaction,
    selectedAccountId,
    selectedCurrency,
    selectedCategoryId,
    isDeleteConfirmOpen,
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
  } = useTransactionsPageModel({
    onFilterClick,
    onTransactionClick,
    uncategorizedLabel,
    uncategorizedAccountLabel,
  });

  return (
    <div className="flex flex-col h-full w-full bg-[var(--panel-bg)]">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto px-5 py-2">
        <div className="flex flex-col gap-6">
          {showSaved && (
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">{savedLabel}</span>
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
            quickAddCurrencyLabel={quickAddCurrencyLabel}
            quickAddAccountErrorLabel={quickAddAccountErrorLabel}
            quickAddCategoryLabel={quickAddCategoryLabel}
            quickAddSubmitLabel={quickAddSubmitLabel}
            editSubmitLabel={editSubmitLabel}
            uncategorizedLabel={uncategorizedLabel}
            uncategorizedAccountLabel={uncategorizedAccountLabel}
            noAccountsLabel={noAccountsLabel}
            amountInput={amountInput}
            descriptionInput={descriptionInput}
            selectedAccountId={selectedAccountId}
            selectedCurrency={selectedCurrency}
            selectedCategoryId={selectedCategoryId}
            editingAmountSign={editingAmountSign}
            showValidation={showValidation}
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
            onAmountChange={setAmountInput}
            onDescriptionChange={setDescriptionInput}
            onSelectedAccountIdChange={setSelectedAccountId}
            onCurrencyChange={setSelectedCurrency}
            onSelectedCategoryIdChange={setSelectedCategoryId}
            onSignChange={setEditingAmountSign}
            onSubmit={() => {
              void handleSubmit();
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
            deleteActionLabel={deleteActionLabel}
            editActionLabel={editActionLabel}
            pendingDeleteTransactionId={pendingDeleteTransactionId}
            onDeleteTransaction={requestDeleteTransaction}
            resolveAccountLabel={resolveAccountLabel}
            resolveCategoryLabel={resolveCategoryLabel}
            onTransactionClick={handleTransactionRowClick}
          />
        </div>
      </div>

      <TransactionDeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        isLoading={pendingDeleteTransactionId !== null}
        titleLabel={deleteConfirmTitle}
        messageLabel={deleteConfirmHint}
        confirmLabel={deleteConfirmLabel}
        cancelLabel={deleteCancelLabel}
        transactionName={deleteConfirmTransactionName}
        onCancel={cancelDeleteTransaction}
        onConfirm={() => {
          void confirmDeleteTransaction();
        }}
      />
    </div>
  );
}
