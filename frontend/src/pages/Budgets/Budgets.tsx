import { DEFAULT_NAV_ITEMS } from "@/constants";
import type { NavItem } from "@/modules/budgets";
import { PhosphorIcon } from "@/components";
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
  quickAddCategoryErrorLabel?: string;
  quickAddAmountLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddAmountErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  emptyActionLabel?: string;
  errorLabel?: string;
  navItems?: NavItem[];
  onAddClick?: () => void;
  onBudgetClick?: (budgetId: string) => void;
  onNavItemClick?: (index: number) => void;
}

export function Budgets({
  avatarInitials = "JS",
  headerTitle = "Presupuestos",
  summaryTitle = "RESUMEN DE PRESUPUESTO",
  summaryLeftLabel = "Total Gastado",
  summaryRightLabel = "Presupuesto Total",
  summaryProgressLabel = "usado",
  sectionTitle = "Mis Budgets",
  quickAddTitle = "Nuevo budget",
  quickAddCategoryLabel = "Categoría",
  quickAddCategoryErrorLabel = "Selecciona una categoría.",
  quickAddAmountLabel = "Monto límite",
  quickAddSubmitLabel = "Guardar budget",
  quickAddAmountErrorLabel = "Ingresa un monto mayor a 0.",
  loadingLabel = "Cargando budgets...",
  emptyTitle = "No hay budgets",
  emptyHint = "Agrega un budget para empezar a organizar tus gastos.",
  emptyActionLabel = "Crear budget",
  errorLabel = "No pudimos cargar los budgets. Intenta nuevamente.",
  navItems = DEFAULT_NAV_ITEMS,
  onAddClick,
  onBudgetClick,
  onNavItemClick,
}: BudgetsProps) {
  const {
    categoryById,
    error,
    expensesByCategoryId,
    handleCreate,
    handleNextMonth,
    handleOpenEditor,
    handlePreviousMonth,
    handleHeaderAction,
    isAmountValid,
    isCategoryValid,
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
    selectedMonthLabel,
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
          <div className="px-5">
            <div className="flex items-center justify-between rounded-2xl bg-[#F4F4F5] px-3 py-2">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3F3F46]"
                aria-label="Mes anterior"
              >
                <PhosphorIcon name="caret-left" />
              </button>
              <span className="text-sm font-semibold text-[#18181B]">{selectedMonthLabel}</span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3F3F46]"
                aria-label="Mes siguiente"
              >
                <PhosphorIcon name="caret-right" />
              </button>
            </div>
          </div>

          <BudgetQuickAddWidget
            isOpen={isEditorOpen}
            title={quickAddTitle}
            categoryLabel={quickAddCategoryLabel}
            categoryErrorLabel={quickAddCategoryErrorLabel}
            amountLabel={quickAddAmountLabel}
            submitLabel={quickAddSubmitLabel}
            amountErrorLabel={quickAddAmountErrorLabel}
            categories={sortedCategories}
            selectedCategoryId={selectedCategoryId}
            limitAmountInput={limitAmountInput}
            showValidation={showValidation}
            isAmountValid={isAmountValid}
            isCategoryValid={isCategoryValid}
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
            rawProgress={summary.rawProgress}
            overspentAmount={summary.overspentAmount}
          />

          <BudgetListWidget
            sectionTitle={sectionTitle}
            isLoading={isLoading}
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            errorMessage={error}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            emptyActionLabel={emptyActionLabel}
            items={visibleBudgets}
            expensesByCategoryId={expensesByCategoryId}
            categoryById={categoryById}
            onBudgetClick={onBudgetClick}
            onEmptyAction={handleOpenEditor}
          />
        </div>
      </div>
      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
