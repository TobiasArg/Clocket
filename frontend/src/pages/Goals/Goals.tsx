import type { NavItem } from "@/modules/goals";
import {
  BottomNavigation,
  GoalsListWidget,
  GoalsQuickAddWidget,
  GoalsSummaryWidget,
  PageHeader,
  useGoalsPageModel,
} from "@/modules/goals";

export interface GoalsProps {
  avatarInitials?: string;
  headerTitle?: string;
  summaryTitle?: string;
  totalLabel?: string;
  goalLabel?: string;
  progressLabel?: string;
  sectionTitle?: string;
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddTargetAmountLabel?: string;
  quickAddSavedAmountLabel?: string;
  quickAddTargetMonthLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddNameErrorLabel?: string;
  quickAddTargetErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  deleteActionLabel?: string;
  navItems?: NavItem[];
  onAddClick?: () => void;
  onNavItemClick?: (index: number) => void;
}

export function Goals({
  avatarInitials = "JS",
  headerTitle = "Goals",
  summaryTitle = "RESUMEN DE AHORRO",
  totalLabel = "Total Ahorrado",
  goalLabel = "Meta Total",
  progressLabel = "completado",
  sectionTitle = "Mis Goals",
  quickAddTitle = "Nueva meta",
  quickAddNameLabel = "Nombre",
  quickAddTargetAmountLabel = "Meta",
  quickAddSavedAmountLabel = "Ahorrado",
  quickAddTargetMonthLabel = "Mes objetivo",
  quickAddSubmitLabel = "Guardar meta",
  quickAddNameErrorLabel = "Agrega un nombre corto.",
  quickAddTargetErrorLabel = "La meta debe ser mayor a 0.",
  loadingLabel = "Cargando metas...",
  emptyTitle = "No hay metas",
  emptyHint = "Agrega una meta para empezar a ahorrar con foco.",
  errorLabel = "No pudimos cargar las metas. Intenta nuevamente.",
  deleteActionLabel = "Delete",
  navItems = [
    { icon: "house", label: "Home", to: "/home" },
    { icon: "wallet", label: "Budgets", to: "/budgets" },
    { icon: "chart-pie-slice", label: "Statistics", to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", to: "/investments" },
    { icon: "dots-three-outline", label: "Más", active: true, to: "/more" },
  ],
  onAddClick,
  onNavItemClick,
}: GoalsProps) {
  const {
    error,
    goalRows,
    handleCreate,
    handleHeaderAction,
    handleRemove,
    isEditorOpen,
    isFormValid,
    isLoading,
    isTargetValid,
    isTitleValid,
    savedAmountInput,
    setSavedAmountInput,
    setTargetAmountInput,
    setTargetMonthInput,
    setTitleInput,
    showValidation,
    summary,
    targetAmountInput,
    targetMonthInput,
    titleInput,
  } = useGoalsPageModel({ onAddClick });

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto">
        <GoalsQuickAddWidget
          isOpen={isEditorOpen}
          title={quickAddTitle}
          quickAddNameLabel={quickAddNameLabel}
          quickAddTargetAmountLabel={quickAddTargetAmountLabel}
          quickAddSavedAmountLabel={quickAddSavedAmountLabel}
          quickAddTargetMonthLabel={quickAddTargetMonthLabel}
          quickAddSubmitLabel={quickAddSubmitLabel}
          quickAddNameErrorLabel={quickAddNameErrorLabel}
          quickAddTargetErrorLabel={quickAddTargetErrorLabel}
          titleInput={titleInput}
          targetAmountInput={targetAmountInput}
          savedAmountInput={savedAmountInput}
          targetMonthInput={targetMonthInput}
          showValidation={showValidation}
          isTitleValid={isTitleValid}
          isTargetValid={isTargetValid}
          isFormValid={isFormValid}
          isLoading={isLoading}
          onTitleChange={setTitleInput}
          onTargetAmountChange={setTargetAmountInput}
          onSavedAmountChange={setSavedAmountInput}
          onTargetMonthChange={setTargetMonthInput}
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
          deleteActionLabel={deleteActionLabel}
          items={goalRows}
          onDelete={(id) => {
            void handleRemove(id);
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
