import { useCallback } from "react";
import { DEFAULT_NAV_ITEMS } from "@/constants";
import type { GoalColorKey, NavItem } from "@/modules/goals";
import {
  BottomNavigation,
  GoalsListWidget,
  GoalsQuickAddWidget,
  GoalsSummaryWidget,
  PageHeader,
  useGoalsPageModel,
} from "@/modules/goals";

export interface GoalsProps {
  headerTitle?: string;
  summaryTitle?: string;
  totalLabel?: string;
  goalLabel?: string;
  progressLabel?: string;
  sectionTitle?: string;
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddTargetAmountLabel?: string;
  quickAddDescriptionLabel?: string;
  quickAddDeadlineLabel?: string;
  quickAddCurrencyLabel?: string;
  quickAddIconLabel?: string;
  quickAddColorLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddNameErrorLabel?: string;
  quickAddTargetErrorLabel?: string;
  quickAddDescriptionErrorLabel?: string;
  quickAddDeadlineErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  navItems?: NavItem[];
  onBackClick?: () => void;
  onAddClick?: () => void;
  onGoalClick?: (goalId: string) => void;
  onNavItemClick?: (index: number) => void;
}

export function Goals({
  headerTitle = "Metas",
  summaryTitle = "RESUMEN DE AHORRO",
  totalLabel = "Total Ahorrado",
  goalLabel = "Meta Total",
  progressLabel = "completado",
  sectionTitle = "Mis Goals",
  quickAddTitle = "Nueva meta",
  quickAddNameLabel = "Nombre",
  quickAddDescriptionLabel = "Descripción",
  quickAddTargetAmountLabel = "Meta",
  quickAddDeadlineLabel = "Fecha límite",
  quickAddCurrencyLabel = "Moneda",
  quickAddIconLabel = "Ícono",
  quickAddColorLabel = "Color",
  quickAddSubmitLabel = "Guardar meta",
  quickAddNameErrorLabel = "Agrega un nombre corto.",
  quickAddTargetErrorLabel = "La meta debe ser mayor a 0.",
  quickAddDescriptionErrorLabel = "Agrega una descripción breve.",
  quickAddDeadlineErrorLabel = "Selecciona una fecha límite válida.",
  loadingLabel = "Cargando metas...",
  emptyTitle = "No hay metas",
  emptyHint = "Agrega una meta para empezar a ahorrar con foco.",
  errorLabel = "No pudimos cargar las metas. Intenta nuevamente.",
  navItems = DEFAULT_NAV_ITEMS,
  onBackClick,
  onAddClick,
  onGoalClick,
  onNavItemClick,
}: GoalsProps) {
  const {
    colorOptions,
    deadlineDateInput,
    descriptionInput,
    error,
    goalRows,
    handleCreate,
    handleCloseEditor,
    handleHeaderAction,
    iconOptions,
    isDeadlineValid,
    isDescriptionValid,
    isEditorOpen,
    isFormValid,
    isIconValid,
    isLoading,
    isTargetValid,
    isTitleValid,
    selectedColorKey,
    selectedCurrency,
    selectedIcon,
    setDeadlineDateInput,
    setDescriptionInput,
    setSelectedColorKey,
    setSelectedCurrency,
    setSelectedIcon,
    setTargetAmountInput,
    setTitleInput,
    showValidation,
    summary,
    targetAmountInput,
    titleInput,
  } = useGoalsPageModel({ onAddClick });

  const handleOpenGoal = useCallback((id: string) => { onGoalClick?.(id); }, [onGoalClick]);
  const handleColorKeyChange = useCallback((value: string) => { setSelectedColorKey(value as GoalColorKey); }, [setSelectedColorKey]);
  const handleCreateVoid = useCallback(() => { void handleCreate(); }, [handleCreate]);

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)]">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={isEditorOpen ? undefined : handleHeaderAction}
        actionIcon="plus"
      />
      <div className="relative flex-1 overflow-hidden">
        <div className={`h-full overflow-auto pb-2 ${isEditorOpen ? "pointer-events-none" : ""}`}>
          <GoalsSummaryWidget
            summaryTitle={summaryTitle}
            totalLabel={totalLabel}
            goalLabel={goalLabel}
            progressLabel={progressLabel}
            totalSaved={summary.totalSaved}
            totalTarget={summary.totalTarget}
            percent={summary.percent}
          />

          <GoalsListWidget
            sectionTitle={sectionTitle}
            isLoading={isLoading}
            hasError={Boolean(error)}
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            items={goalRows}
            onOpenGoal={handleOpenGoal}
          />
        </div>

        <GoalsQuickAddWidget
          colorOptions={colorOptions}
          isOpen={isEditorOpen}
          title={quickAddTitle}
          quickAddNameLabel={quickAddNameLabel}
          quickAddDescriptionLabel={quickAddDescriptionLabel}
          quickAddTargetAmountLabel={quickAddTargetAmountLabel}
          quickAddCurrencyLabel={quickAddCurrencyLabel}
          quickAddDeadlineLabel={quickAddDeadlineLabel}
          quickAddIconLabel={quickAddIconLabel}
          quickAddColorLabel={quickAddColorLabel}
          quickAddSubmitLabel={quickAddSubmitLabel}
          quickAddNameErrorLabel={quickAddNameErrorLabel}
          quickAddTargetErrorLabel={quickAddTargetErrorLabel}
          quickAddDescriptionErrorLabel={quickAddDescriptionErrorLabel}
          quickAddDeadlineErrorLabel={quickAddDeadlineErrorLabel}
          iconOptions={iconOptions}
          titleInput={titleInput}
          descriptionInput={descriptionInput}
          targetAmountInput={targetAmountInput}
          deadlineDateInput={deadlineDateInput}
          selectedCurrency={selectedCurrency}
          selectedIcon={selectedIcon}
          selectedColorKey={selectedColorKey}
          showValidation={showValidation}
          isTitleValid={isTitleValid}
          isDescriptionValid={isDescriptionValid}
          isTargetValid={isTargetValid}
          isDeadlineValid={isDeadlineValid}
          isIconValid={isIconValid}
          isFormValid={isFormValid}
          isLoading={isLoading}
          onRequestClose={handleCloseEditor}
          onTitleChange={setTitleInput}
          onDescriptionChange={setDescriptionInput}
          onTargetAmountChange={setTargetAmountInput}
          onCurrencyChange={setSelectedCurrency}
          onDeadlineDateChange={setDeadlineDateInput}
          onIconChange={setSelectedIcon}
          onColorKeyChange={handleColorKeyChange}
          onSubmit={handleCreateVoid}
        />
      </div>
      <BottomNavigation
        items={navItems}
        activeColor="text-[#10B981]"
        onItemClick={onNavItemClick}
      />
    </div>
  );
}
