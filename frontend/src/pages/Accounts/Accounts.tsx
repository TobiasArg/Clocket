import {
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
  updatedPrefix = "Actualizado",
  incomeLabel = "In",
  expenseLabel = "Out",
  onBackClick,
  onAddClick,
}: AccountsProps) {
  const {
    accountFlowsById,
    balanceInput,
    error,
    handleCreate,
    handleHeaderAction,
    isBalanceValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    isNameValid,
    nameInput,
    setBalanceInput,
    setNameInput,
    showValidation,
    totalBalance,
    visibleAccounts,
  } = useAccountsPageModel({ onAddClick });

  return (
    <div className="flex flex-col h-full w-full bg-white">
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
            updatedPrefix={updatedPrefix}
            incomeLabel={incomeLabel}
            expenseLabel={expenseLabel}
          />
        </div>
      </div>
    </div>
  );
}
