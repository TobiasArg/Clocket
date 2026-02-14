import {
  PageHeader,
  PlansListWidget,
  PlansQuickAddWidget,
  usePlansPageModel,
} from "@/modules/plans";

export interface PlansProps {
  headerTitle?: string;
  cuotaLabel?: string;
  totalLabel?: string;
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddTotalAmountLabel?: string;
  quickAddInstallmentsLabel?: string;
  quickAddStartMonthLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddTotalAmountPlaceholder?: string;
  quickAddInstallmentsPlaceholder?: string;
  quickAddSubmitLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  loadingLabel?: string;
  errorLabel?: string;
  totalAmountErrorLabel?: string;
  installmentsErrorLabel?: string;
  startMonthErrorLabel?: string;
  onBackClick?: () => void;
  onAddClick?: () => void;
  onPlanClick?: (index: number) => void;
}

export function Plans({
  headerTitle = "Planes de Cuotas",
  cuotaLabel = "Cuota mensual",
  totalLabel = "Costo total",
  quickAddTitle = "Nueva cuota",
  quickAddNameLabel = "Título",
  quickAddTotalAmountLabel = "Monto total",
  quickAddInstallmentsLabel = "Cantidad de cuotas",
  quickAddStartMonthLabel = "Mes de inicio",
  quickAddNamePlaceholder = "Ej. Notebook",
  quickAddTotalAmountPlaceholder = "0.00",
  quickAddInstallmentsPlaceholder = "12",
  quickAddSubmitLabel = "Guardar cuota",
  emptyTitle = "No hay cuotas activas",
  emptyHint = "Agrega una cuota para ver el pendiente mensual.",
  loadingLabel = "Cargando cuotas...",
  errorLabel = "No pudimos cargar las cuotas. Intenta nuevamente.",
  totalAmountErrorLabel = "Ingresa un monto mayor a 0.",
  installmentsErrorLabel = "Usa al menos 1 cuota.",
  startMonthErrorLabel = "Usa formato YYYY-MM.",
  onBackClick,
  onAddClick,
  onPlanClick,
}: PlansProps) {
  const {
    activeCuotas,
    installmentsCountInput,
    isEditorOpen,
    isFormValid,
    isInstallmentsCountValid,
    isLoading,
    isStartMonthValid,
    isTotalAmountValid,
    nameInput,
    setInstallmentsCountInput,
    setNameInput,
    setStartMonthInput,
    setTotalAmountInput,
    showValidation,
    startMonthInput,
    totalAmountInput,
    error,
    handleCreate,
    handleHeaderAction,
  } = usePlansPageModel({ onAddClick });

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="flex flex-col gap-4">
          <PlansQuickAddWidget
            isOpen={isEditorOpen}
            title={quickAddTitle}
            nameLabel={quickAddNameLabel}
            totalAmountLabel={quickAddTotalAmountLabel}
            installmentsLabel={quickAddInstallmentsLabel}
            startMonthLabel={quickAddStartMonthLabel}
            namePlaceholder={quickAddNamePlaceholder}
            totalAmountPlaceholder={quickAddTotalAmountPlaceholder}
            installmentsPlaceholder={quickAddInstallmentsPlaceholder}
            submitLabel={quickAddSubmitLabel}
            totalAmountErrorLabel={totalAmountErrorLabel}
            installmentsErrorLabel={installmentsErrorLabel}
            startMonthErrorLabel={startMonthErrorLabel}
            nameInput={nameInput}
            totalAmountInput={totalAmountInput}
            installmentsCountInput={installmentsCountInput}
            startMonthInput={startMonthInput}
            showValidation={showValidation}
            isTotalAmountValid={isTotalAmountValid}
            isInstallmentsCountValid={isInstallmentsCountValid}
            isStartMonthValid={isStartMonthValid}
            isFormValid={isFormValid}
            isLoading={isLoading}
            onNameChange={setNameInput}
            onTotalAmountChange={setTotalAmountInput}
            onInstallmentsCountChange={setInstallmentsCountInput}
            onStartMonthChange={setStartMonthInput}
            onSubmit={() => {
              void handleCreate();
            }}
          />

          <PlansListWidget
            items={activeCuotas}
            isLoading={isLoading}
            hasError={Boolean(error)}
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            cuotaLabel={cuotaLabel}
            totalLabel={totalLabel}
            onPlanClick={onPlanClick}
          />
        </div>
      </div>
    </div>
  );
}
