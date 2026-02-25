import { DEFAULT_NAV_ITEMS } from "@/constants";
import type { NavItem } from "@/modules/budgets";
import { useRef } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
  quickAddNameLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddNameErrorLabel?: string;
  quickAddCategoryLabel?: string;
  quickAddCategoryErrorLabel?: string;
  quickAddDuplicateCategoryErrorLabel?: string;
  quickAddCreateCategoryLabel?: string;
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
  quickAddNameLabel = "Nombre del budget",
  quickAddNamePlaceholder = "Ej. Gastos fijos de casa",
  quickAddNameErrorLabel = "Agrega un nombre para el budget.",
  quickAddCategoryLabel = "Categorías incluidas",
  quickAddCategoryErrorLabel = "Selecciona al menos una categoría y subcategoría válida.",
  quickAddDuplicateCategoryErrorLabel = "Ya existe un budget para parte del alcance seleccionado en el mes.",
  quickAddCreateCategoryLabel = "Nueva categoría",
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
  const monthTouchStartXRef = useRef<number | null>(null);
  const monthTouchStartYRef = useRef<number | null>(null);
  const monthTrackingRef = useRef<boolean>(false);
  const monthPointerIdRef = useRef<number | null>(null);
  const monthLabelRef = useRef<HTMLDivElement | null>(null);
  const monthDragXRef = useRef<number>(0);

  const {
    budgetFormValidationLabel,
    budgetNameInput,
    categoriesError,
    categoryColorOptions,
    categoryIconOptions,
    categoryById,
    error,
    expensesByBudgetId,
    handleCloseEditor,
    handleCreateCategory,
    handleCreate,
    handleNextMonth,
    handleOpenEditor,
    handlePreviousMonth,
    handleHeaderAction,
    isAmountValid,
    isBudgetNameValid,
    isCategoriesLoading,
    isDuplicateCategoryMonth,
    isEditorOpen,
    isFormValid,
    isLoading,
    isScopeValid,
    limitAmountInput,
    selectedScopeRules,
    setBudgetNameInput,
    setLimitAmountInput,
    setSelectedScopeRules,
    showValidation,
    sortedCategories,
    summary,
    visibleBudgets,
    selectedMonthLabel,
  } = useBudgetsPageModel({ onAddClick });

  const applyMonthDrag = (nextOffset: number, shouldAnimate: boolean) => {
    monthDragXRef.current = nextOffset;

    const node = monthLabelRef.current;
    if (!node) {
      return;
    }

    node.style.transition = shouldAnimate
      ? "transform 200ms ease-out"
      : "none";
    node.style.transform = `translateX(${nextOffset}px)`;
  };

  const resetMonthGesture = () => {
    monthTouchStartXRef.current = null;
    monthTouchStartYRef.current = null;
    monthTrackingRef.current = false;
    monthPointerIdRef.current = null;
    applyMonthDrag(0, true);
  };

  const handleMonthTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      return;
    }

    monthTouchStartXRef.current = event.touches[0].clientX;
    monthTouchStartYRef.current = event.touches[0].clientY;
    monthTrackingRef.current = true;
    applyMonthDrag(0, false);
  };

  const handleMonthTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!monthTrackingRef.current) {
      return;
    }

    const startX = monthTouchStartXRef.current;
    const startY = monthTouchStartYRef.current;
    if (startX === null || startY === null) {
      resetMonthGesture();
      return;
    }

    const deltaX = event.touches[0].clientX - startX;
    const deltaY = event.touches[0].clientY - startY;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      return;
    }

    event.preventDefault();
    const next = Math.max(-96, Math.min(96, deltaX * 0.72));
    applyMonthDrag(next, false);
  };

  const handleMonthTouchEnd = () => {
    if (!monthTrackingRef.current) {
      return;
    }

    const threshold = 32;
    const deltaX = monthDragXRef.current;
    resetMonthGesture();

    if (deltaX <= -threshold) {
      handleNextMonth();
      return;
    }

    if (deltaX >= threshold) {
      handlePreviousMonth();
    }
  };

  const handleMonthPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      return;
    }

    monthTouchStartXRef.current = event.clientX;
    monthTouchStartYRef.current = event.clientY;
    monthTrackingRef.current = true;
    monthPointerIdRef.current = event.pointerId;
    applyMonthDrag(0, false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMonthPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !monthTrackingRef.current ||
      monthPointerIdRef.current === null ||
      event.pointerId !== monthPointerIdRef.current
    ) {
      return;
    }

    const startX = monthTouchStartXRef.current;
    const startY = monthTouchStartYRef.current;
    if (startX === null || startY === null) {
      resetMonthGesture();
      return;
    }

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      return;
    }

    event.preventDefault();
    const next = Math.max(-96, Math.min(96, deltaX * 0.72));
    applyMonthDrag(next, false);
  };

  const handleMonthPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      return;
    }

    if (
      monthPointerIdRef.current !== null &&
      event.pointerId === monthPointerIdRef.current &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!monthTrackingRef.current) {
      return;
    }

    const threshold = 32;
    const deltaX = monthDragXRef.current;
    resetMonthGesture();

    if (deltaX <= -threshold) {
      handleNextMonth();
      return;
    }

    if (deltaX >= threshold) {
      handlePreviousMonth();
    }
  };

  const resolvedBudgetFormValidationLabel = showValidation && isDuplicateCategoryMonth
    ? quickAddDuplicateCategoryErrorLabel
    : budgetFormValidationLabel;

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)]">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={isEditorOpen ? undefined : handleHeaderAction}
        actionIcon="plus"
      />
      <div className="relative flex-1 overflow-hidden">
        <div className={`h-full overflow-auto ${isEditorOpen ? "pointer-events-none" : ""}`}>
          <div className="flex flex-col gap-4 py-5">
            <div className="px-5">
              <div
                onTouchStart={handleMonthTouchStart}
                onTouchMove={handleMonthTouchMove}
                onTouchEnd={handleMonthTouchEnd}
                onTouchCancel={resetMonthGesture}
                onPointerDown={handleMonthPointerDown}
                onPointerMove={handleMonthPointerMove}
                onPointerUp={handleMonthPointerEnd}
                onPointerCancel={handleMonthPointerEnd}
                className="touch-pan-y select-none rounded-2xl bg-[var(--surface-muted)] px-3 py-2.5"
                aria-label="Selector de mes por deslizamiento"
              >
                <div
                  ref={monthLabelRef}
                  className="flex items-center justify-center transition-transform duration-200 ease-out"
                  style={{ transform: "translateX(0px)" }}
                >
                  <span className="block max-w-full truncate text-xs font-semibold tracking-[0.2px] text-[var(--text-secondary)]">
                    {selectedMonthLabel}
                  </span>
                </div>
              </div>
            </div>

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
              expensesByBudgetId={expensesByBudgetId}
              categoryById={categoryById}
              onBudgetClick={onBudgetClick}
              onEmptyAction={handleOpenEditor}
            />
          </div>
        </div>

        <BudgetQuickAddWidget
          isOpen={isEditorOpen}
          onRequestClose={handleCloseEditor}
          title={quickAddTitle}
          budgetNameLabel={quickAddNameLabel}
          budgetNamePlaceholder={quickAddNamePlaceholder}
          budgetNameErrorLabel={quickAddNameErrorLabel}
          budgetNameInput={budgetNameInput}
          budgetFormValidationLabel={resolvedBudgetFormValidationLabel}
          categoryLabel={quickAddCategoryLabel}
          categoryErrorLabel={quickAddCategoryErrorLabel}
          categoryCreateActionLabel={quickAddCreateCategoryLabel}
          amountLabel={quickAddAmountLabel}
          submitLabel={quickAddSubmitLabel}
          amountErrorLabel={quickAddAmountErrorLabel}
          categories={sortedCategories}
          categoryIconOptions={categoryIconOptions}
          categoryColorOptions={categoryColorOptions}
          selectedScopeRules={selectedScopeRules}
          limitAmountInput={limitAmountInput}
          showValidation={showValidation}
          isAmountValid={isAmountValid}
          isBudgetNameValid={isBudgetNameValid}
          isCategoriesLoading={isCategoriesLoading}
          isScopeValid={isScopeValid}
          isFormValid={isFormValid}
          isLoading={isLoading}
          categoriesError={categoriesError}
          onBudgetNameChange={setBudgetNameInput}
          onScopeRulesChange={setSelectedScopeRules}
          onCreateCategory={handleCreateCategory}
          onAmountChange={setLimitAmountInput}
          onSubmit={() => {
            void handleCreate();
          }}
        />
      </div>
      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
