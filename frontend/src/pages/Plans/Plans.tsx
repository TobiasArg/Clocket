import {
  PlanStatusCounter,
  PageHeader,
  PlansListWidget,
  PlansQuickAddWidget,
  usePlansPageModel,
} from "@/modules/plans";

export interface PlansProps {
  activeStatusLabel?: string;
  headerTitle?: string;
  finishedStatusLabel?: string;
  totalStatusLabel?: string;
  cuotaLabel?: string;
  totalLabel?: string;
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddTotalAmountLabel?: string;
  quickAddCurrencyLabel?: string;
  quickAddInstallmentsLabel?: string;
  quickAddCreationDateLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddTotalAmountPlaceholder?: string;
  quickAddInstallmentsPlaceholder?: string;
  quickAddSubmitLabel?: string;
  emptyAllTitle?: string;
  emptyAllHint?: string;
  emptyActiveTitle?: string;
  emptyActiveHint?: string;
  emptyFinishedTitle?: string;
  emptyFinishedHint?: string;
  loadingLabel?: string;
  errorLabel?: string;
  totalAmountErrorLabel?: string;
  installmentsErrorLabel?: string;
  creationDateErrorLabel?: string;
  deleteActionLabel?: string;
  deleteCancelLabel?: string;
  deleteConfirmHint?: string;
  deleteConfirmLabel?: string;
  deleteConfirmTitle?: string;
  invalidDateErrorLabel?: string;
  markInstallmentAriaLabel?: string;
  onBackClick?: () => void;
  onAddClick?: () => void;
  onPlanClick?: (index: number) => void;
}

export function Plans({
  activeStatusLabel = "Activos",
  headerTitle = "Planes de Cuotas",
  finishedStatusLabel = "Finalizados",
  totalStatusLabel = "Totales",
  cuotaLabel = "Cuota mensual",
  totalLabel = "Costo total",
  quickAddTitle = "Nueva cuota",
  quickAddNameLabel = "Título",
  quickAddTotalAmountLabel = "Monto total",
  quickAddCurrencyLabel = "Moneda",
  quickAddInstallmentsLabel = "Cantidad de cuotas",
  quickAddCreationDateLabel = "Fecha de creación",
  quickAddNamePlaceholder = "Ej. Notebook",
  quickAddTotalAmountPlaceholder = "0.00",
  quickAddInstallmentsPlaceholder = "12",
  quickAddSubmitLabel = "Guardar cuota",
  emptyAllTitle = "No hay planes de cuotas",
  emptyAllHint = "Agrega una cuota para comenzar a registrar tus planes.",
  emptyActiveTitle = "No hay cuotas activas",
  emptyActiveHint = "Agrega una cuota para ver el pendiente mensual.",
  emptyFinishedTitle = "No hay cuotas finalizadas",
  emptyFinishedHint = "Cuando completes todas las cuotas, aparecerán aquí.",
  loadingLabel = "Cargando cuotas...",
  errorLabel = "No pudimos cargar las cuotas. Intenta nuevamente.",
  totalAmountErrorLabel = "Ingresa un monto mayor a 0.",
  installmentsErrorLabel = "Usa al menos 1 cuota.",
  creationDateErrorLabel = "Usa una fecha válida que no sea futura.",
  deleteActionLabel = "Eliminar",
  deleteCancelLabel = "Cancelar",
  deleteConfirmHint = "Se eliminará el plan y todas sus transacciones.",
  deleteConfirmLabel = "Eliminar",
  deleteConfirmTitle = "¿Eliminar este plan?",
  invalidDateErrorLabel = "Fecha inválida",
  markInstallmentAriaLabel = "Marcar cuota como pagada",
  onBackClick,
  onAddClick,
  onPlanClick,
}: PlansProps) {
  const {
    activeCount,
    creationDateInput,
    deleteConfirmPlanId,
    filteredPlans,
    finishedCount,
    installmentsCountInput,
    isEditorOpen,
    isCreationDateValid,
    selectedCurrency,
    isFormValid,
    isInstallmentsCountValid,
    isLoading,
    isTotalAmountValid,
    invalidDatePlanId,
    nameInput,
    paidFeedbackPlanId,
    pendingPaidPlanId,
    setCreationDateInput,
    setDeleteConfirmPlanId,
    setInstallmentsCountInput,
    setNameInput,
    setSelectedCurrency,
    setStatusFilter,
    setTotalAmountInput,
    showValidation,
    statusFilter,
    totalCount,
    totalAmountInput,
    error,
    handleCloseEditor,
    handleCreate,
    handleDeletePlan,
    handleHeaderAction,
    handleMarkInstallmentPaid,
  } = usePlansPageModel({ onAddClick });

  const resolvedEmptyTitle = statusFilter === "all"
    ? emptyAllTitle
    : statusFilter === "active"
      ? emptyActiveTitle
      : emptyFinishedTitle;
  const resolvedEmptyHint = statusFilter === "all"
    ? emptyAllHint
    : statusFilter === "active"
      ? emptyActiveHint
      : emptyFinishedHint;

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)]">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={isEditorOpen ? undefined : handleHeaderAction}
        actionIcon="plus"
      />
      <div className="relative flex-1 overflow-hidden">
        <div className={`h-full overflow-auto px-5 py-4 ${isEditorOpen ? "pointer-events-none" : ""}`}>
          <div className="flex flex-col gap-4">
            <div className="flex min-w-0 gap-2">
              <PlanStatusCounter
                status="all"
                label={totalStatusLabel}
                count={totalCount}
                isSelected={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              />
              <PlanStatusCounter
                status="active"
                label={activeStatusLabel}
                count={activeCount}
                isSelected={statusFilter === "active"}
                onClick={() => setStatusFilter("active")}
              />
              <PlanStatusCounter
                status="finished"
                label={finishedStatusLabel}
                count={finishedCount}
                isSelected={statusFilter === "finished"}
                onClick={() => setStatusFilter("finished")}
              />
            </div>

            <PlansListWidget
              items={filteredPlans}
              isLoading={isLoading}
              hasError={Boolean(error)}
              loadingLabel={loadingLabel}
              errorLabel={errorLabel}
              emptyTitle={resolvedEmptyTitle}
              emptyHint={resolvedEmptyHint}
              cuotaLabel={cuotaLabel}
              totalLabel={totalLabel}
              markInstallmentAriaLabel={markInstallmentAriaLabel}
              pendingPaidPlanId={pendingPaidPlanId}
              paidFeedbackPlanId={paidFeedbackPlanId}
              invalidDatePlanId={invalidDatePlanId}
              invalidDateErrorLabel={invalidDateErrorLabel}
              deleteActionLabel={deleteActionLabel}
              deleteConfirmPlanId={deleteConfirmPlanId}
              deleteConfirmTitle={deleteConfirmTitle}
              deleteConfirmHint={deleteConfirmHint}
              deleteCancelLabel={deleteCancelLabel}
              deleteConfirmLabel={deleteConfirmLabel}
              onDeleteConfirmPlanIdChange={setDeleteConfirmPlanId}
              onDeletePlan={(id) => {
                void handleDeletePlan(id);
              }}
              onMarkInstallmentPaid={(id) => {
                void handleMarkInstallmentPaid(id);
              }}
              onPlanClick={onPlanClick}
            />
          </div>
        </div>

        <PlansQuickAddWidget
          isOpen={isEditorOpen}
          title={quickAddTitle}
          nameLabel={quickAddNameLabel}
          totalAmountLabel={quickAddTotalAmountLabel}
          currencyLabel={quickAddCurrencyLabel}
          installmentsLabel={quickAddInstallmentsLabel}
          creationDateLabel={quickAddCreationDateLabel}
          namePlaceholder={quickAddNamePlaceholder}
          totalAmountPlaceholder={quickAddTotalAmountPlaceholder}
          installmentsPlaceholder={quickAddInstallmentsPlaceholder}
          submitLabel={quickAddSubmitLabel}
          totalAmountErrorLabel={totalAmountErrorLabel}
          installmentsErrorLabel={installmentsErrorLabel}
          creationDateErrorLabel={creationDateErrorLabel}
          nameInput={nameInput}
          totalAmountInput={totalAmountInput}
          installmentsCountInput={installmentsCountInput}
          creationDateInput={creationDateInput}
          selectedCurrency={selectedCurrency}
          showValidation={showValidation}
          isTotalAmountValid={isTotalAmountValid}
          isInstallmentsCountValid={isInstallmentsCountValid}
          isCreationDateValid={isCreationDateValid}
          isFormValid={isFormValid}
          isLoading={isLoading}
          onNameChange={setNameInput}
          onTotalAmountChange={setTotalAmountInput}
          onInstallmentsCountChange={setInstallmentsCountInput}
          onCurrencyChange={setSelectedCurrency}
          onCreationDateChange={setCreationDateInput}
          onRequestClose={handleCloseEditor}
          onSubmit={() => {
            void handleCreate();
          }}
        />
      </div>
    </div>
  );
}
