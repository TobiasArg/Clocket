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
    selectedIcon,
    setDeadlineDateInput,
    setDescriptionInput,
    setSelectedColorKey,
    setSelectedIcon,
    setTargetAmountInput,
    setTitleInput,
    showValidation,
    summary,
    targetAmountInput,
    titleInput,
  } = useGoalsPageModel({ onAddClick });

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto">
        <GoalsQuickAddWidget
          colorOptions={colorOptions}
          isOpen={isEditorOpen}
          title={quickAddTitle}
          quickAddNameLabel={quickAddNameLabel}
          quickAddDescriptionLabel={quickAddDescriptionLabel}
          quickAddTargetAmountLabel={quickAddTargetAmountLabel}
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
          onTitleChange={setTitleInput}
          onDescriptionChange={setDescriptionInput}
          onTargetAmountChange={setTargetAmountInput}
          onDeadlineDateChange={setDeadlineDateInput}
          onIconChange={setSelectedIcon}
          onColorKeyChange={(value) => setSelectedColorKey(value as GoalColorKey)}
          onSubmit={() => {
            void handleCreate();
          }}
        />

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
          onOpenGoal={(id) => {
            onGoalClick?.(id);
          }}
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
