import {
  AccountDeleteConfirmDialog,
  AccountsListWidget,
  AccountsQuickAddWidget,
  AccountsSummaryWidget,
  PageHeader,
  useAccountsPageModel,
} from "@/modules/accounts";

export interface AccountsProps {
  headerTitle?: string;
  summaryTitle?: string;
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddBalanceLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddBalancePlaceholder?: string;
  quickAddSubmitLabel?: string;
  quickAddNameErrorLabel?: string;
  quickAddBalanceErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  deleteActionLabel?: string;
  updatedPrefix?: string;
  incomeLabel?: string;
  expenseLabel?: string;
  onBackClick?: () => void;
  onAddClick?: () => void;
}

export function Accounts({
  headerTitle = "Cuentas",
  summaryTitle = "Balance total",
  quickAddTitle = "Nueva cuenta",
  quickAddNameLabel = "Nombre de la cuenta",
  quickAddBalanceLabel = "Balance inicial",
  quickAddNamePlaceholder = "Ej. Cuenta principal",
  quickAddBalancePlaceholder = "0.00",
  quickAddSubmitLabel = "Guardar cuenta",
  quickAddNameErrorLabel = "Agrega un nombre de cuenta.",
  quickAddBalanceErrorLabel = "Ingresa un balance válido.",
  loadingLabel = "Cargando cuentas...",
  emptyTitle = "No hay cuentas",
  emptyHint = "Crea tu primera cuenta para organizar tu balance.",
  errorLabel = "No pudimos cargar las cuentas. Intenta nuevamente.",
  deleteActionLabel = "Eliminar",
  updatedPrefix = "Actualizado",
  incomeLabel = "Ing.",
  expenseLabel = "Gas.",
  onBackClick,
  onAddClick,
}: AccountsProps) {
  const {
    accountFlowsById,
    balanceInput,
    cancelDeleteAccount,
    confirmDeleteAccount,
    deleteConfirmAccountName,
    deleteConfirmTransactionsCount,
    error,
    handleCreate,
    handleHeaderAction,
    isBalanceValid,
    isDeleteConfirmOpen,
    isEditorOpen,
    isFormValid,
    isLoading,
    isNameValid,
    nameInput,
    pendingDeleteAccountId,
    requestDeleteAccount,
    setBalanceInput,
    setNameInput,
    showValidation,
    totalBalance,
    visibleAccounts,
  } = useAccountsPageModel({ onAddClick });

  return (
    <div className="flex flex-col h-full w-full bg-[var(--panel-bg)]">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />

      <div className="flex-1 overflow-auto px-5 py-3">
        <div className="flex flex-col gap-4">
          <AccountsQuickAddWidget
            isOpen={isEditorOpen}
            title={quickAddTitle}
            nameLabel={quickAddNameLabel}
            balanceLabel={quickAddBalanceLabel}
            namePlaceholder={quickAddNamePlaceholder}
            balancePlaceholder={quickAddBalancePlaceholder}
            submitLabel={quickAddSubmitLabel}
            nameErrorLabel={quickAddNameErrorLabel}
            balanceErrorLabel={quickAddBalanceErrorLabel}
            nameInput={nameInput}
            balanceInput={balanceInput}
            showValidation={showValidation}
            isNameValid={isNameValid}
            isBalanceValid={isBalanceValid}
            isFormValid={isFormValid}
            isLoading={isLoading}
            onNameChange={setNameInput}
            onBalanceChange={setBalanceInput}
            onSubmit={() => {
              void handleCreate();
            }}
          />

          <AccountsSummaryWidget
            summaryTitle={summaryTitle}
            totalBalance={totalBalance}
          />

          <AccountsListWidget
            accounts={visibleAccounts}
            accountFlowsById={accountFlowsById}
            isLoading={isLoading}
            hasError={Boolean(error)}
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            deleteActionLabel={deleteActionLabel}
            updatedPrefix={updatedPrefix}
            incomeLabel={incomeLabel}
            expenseLabel={expenseLabel}
            pendingDeleteAccountId={pendingDeleteAccountId}
            onDeleteAccount={(accountId) => {
              requestDeleteAccount(accountId);
            }}
          />
        </div>
      </div>

      <AccountDeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        isLoading={pendingDeleteAccountId !== null}
        accountName={deleteConfirmAccountName}
        countLabel={deleteConfirmTransactionsCount === 1
          ? "Se eliminará 1 transacción asociada."
          : `Se eliminarán ${deleteConfirmTransactionsCount} transacciones asociadas.`}
        onCancel={cancelDeleteAccount}
        onConfirm={() => {
          void confirmDeleteAccount();
        }}
      />
    </div>
  );
}
