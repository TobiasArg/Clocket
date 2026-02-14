import type { NavItem } from "@/modules/budgets";
import {
  BottomNavigation,
  BudgetListWidget,
  BudgetQuickAddWidget,
  BudgetSummaryWidget,
  PageHeader,
  useBudgetsPageModel,
} from "@/modules/budgets";

export interface BudgetsProps {
  avatarInitials?: string;
  headerTitle?: string;
  summaryTitle?: string;
  summaryLeftLabel?: string;
  summaryRightLabel?: string;
  summaryProgressLabel?: string;
  sectionTitle?: string;
  quickAddTitle?: string;
  quickAddCategoryLabel?: string;
  quickAddAmountLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddAmountErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  navItems?: NavItem[];
  onAddClick?: () => void;
  onBudgetClick?: (index: number) => void;
  onNavItemClick?: (index: number) => void;
}

export function Budgets({
  avatarInitials = "JS",
  headerTitle = "Budgets",
  summaryTitle = "RESUMEN DE PRESUPUESTO",
  summaryLeftLabel = "Total Gastado",
  summaryRightLabel = "Presupuesto Total",
  summaryProgressLabel = "usado",
  sectionTitle = "Mis Budgets",
  quickAddTitle = "Nuevo budget",
  quickAddCategoryLabel = "Categoría",
  quickAddAmountLabel = "Monto límite",
  quickAddSubmitLabel = "Guardar budget",
  quickAddAmountErrorLabel = "Ingresa un monto mayor a 0.",
  loadingLabel = "Cargando budgets...",
  emptyTitle = "No hay budgets",
  emptyHint = "Agrega un budget para empezar a organizar tus gastos.",
  errorLabel = "No pudimos cargar los budgets. Intenta nuevamente.",
  navItems = [
    { icon: "house", label: "Home", to: "/home" },
    { icon: "wallet", label: "Budgets", active: true, to: "/budgets" },
    { icon: "chart-bar", label: "Statistics", to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", to: "/investments" },
    { icon: "dots-three", label: "Más", to: "/more" },
  ],
  onAddClick,
  onBudgetClick,
  onNavItemClick,
}: BudgetsProps) {
  const {
    categoryById,
    error,
    expensesByCategoryId,
    handleCreate,
    handleHeaderAction,
    isAmountValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    limitAmountInput,
    selectedCategoryId,
    setLimitAmountInput,
    setSelectedCategoryId,
    showValidation,
    sortedCategories,
    summary,
    visibleBudgets,
  } = useBudgetsPageModel({ onAddClick });

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-4 py-5">
          <BudgetQuickAddWidget
            isOpen={isEditorOpen}
            title={quickAddTitle}
            categoryLabel={quickAddCategoryLabel}
            amountLabel={quickAddAmountLabel}
            submitLabel={quickAddSubmitLabel}
            amountErrorLabel={quickAddAmountErrorLabel}
            categories={sortedCategories}
            selectedCategoryId={selectedCategoryId}
            limitAmountInput={limitAmountInput}
            showValidation={showValidation}
            isAmountValid={isAmountValid}
            isFormValid={isFormValid}
            isLoading={isLoading}
            onCategoryChange={setSelectedCategoryId}
            onAmountChange={setLimitAmountInput}
            onSubmit={() => {
              void handleCreate();
            }}
          />

          <BudgetSummaryWidget
            summaryTitle={summaryTitle}
            totalSpentLabel={summaryLeftLabel}
            totalBudgetLabel={summaryRightLabel}
            progressLabel={summaryProgressLabel}
            totalSpent={summary.totalSpent}
            totalBudget={summary.totalBudget}
            progress={summary.progress}
          />

          <BudgetListWidget
            sectionTitle={sectionTitle}
            isLoading={isLoading}
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            errorMessage={error}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            items={visibleBudgets}
            expensesByCategoryId={expensesByCategoryId}
            categoryById={categoryById}
            onBudgetClick={onBudgetClick}
          />
        </div>
      </div>
      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
