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
  quickAddIconLabel?: string;
  quickAddNameLabel?: string;
  quickAddBalanceLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddBalancePlaceholder?: string;
  quickAddSubmitLabel?: string;
  quickAddIconErrorLabel?: string;
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
  quickAddIconLabel = "Ícono",
  quickAddNameLabel = "Nombre de la cuenta",
  quickAddBalanceLabel = "Balance inicial",
  quickAddNamePlaceholder = "Ej. Cuenta principal",
  quickAddBalancePlaceholder = "0.00",
  quickAddSubmitLabel = "Guardar cuenta",
  quickAddIconErrorLabel = "Selecciona un ícono para la cuenta.",
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
    accountIconOptions,
    balanceInput,
    cancelDeleteAccount,
    confirmDeleteAccount,
    deleteConfirmAccountName,
    deleteConfirmTransactionsCount,
    error,
    handleCloseEditor,
    handleCreate,
    handleHeaderAction,
    isBalanceValid,
    isDeleteConfirmOpen,
    isEditorOpen,
    isFormValid,
    isIconValid,
    isLoading,
    isNameValid,
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
  } = useAccountsPageModel({ onAddClick });

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)]">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={isEditorOpen ? undefined : handleHeaderAction}
        actionIcon="plus"
      />

      <div className="relative flex-1 overflow-hidden">
        <div className={`h-full overflow-auto px-5 py-3 ${isEditorOpen ? "pointer-events-none" : ""}`}>
          <div className="flex flex-col gap-4">
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

        <AccountsQuickAddWidget
          isOpen={isEditorOpen}
          title={quickAddTitle}
          iconLabel={quickAddIconLabel}
          iconErrorLabel={quickAddIconErrorLabel}
          iconOptions={accountIconOptions}
          selectedIcon={selectedIcon}
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
          isIconValid={isIconValid}
          isNameValid={isNameValid}
          isBalanceValid={isBalanceValid}
          isFormValid={isFormValid}
          isLoading={isLoading}
          onIconChange={setSelectedIcon}
          onNameChange={setNameInput}
          onBalanceChange={setBalanceInput}
          onRequestClose={handleCloseEditor}
          onSubmit={() => {
            void handleCreate();
          }}
        />
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
