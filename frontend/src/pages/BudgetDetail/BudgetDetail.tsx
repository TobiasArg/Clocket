import { useCallback } from "react";
import { BudgetQuickAddWidget } from "@/components/BudgetQuickAddWidget/BudgetQuickAddWidget";
import type { SubcategoryItem } from "@/modules/budget-detail";
import {
  BudgetDetailProgressWidget,
  BudgetDetailSubcategoriesWidget,
  BudgetHero,
  useBudgetDetailPageModel,
} from "@/modules/budget-detail";

export interface BudgetDetailProps {
  budgetId?: string;
  headerBg?: string;
  budgetIcon?: string;
  budgetName?: string;
  budgetDescription?: string;
  spentLabel?: string;
  spentValue?: string;
  percentBadgeText?: string;
  progressPercent?: number;
  progressColor?: string;
  progressUsedLabel?: string;
  progressRemainingLabel?: string;
  subcategoriesTitle?: string;
  addSubLabel?: string;
  subcategories?: SubcategoryItem[];
  loadingLabel?: string;
  emptyLabel?: string;
  onBackClick?: () => void;
  onEditClick?: () => void;
  onAddSubcategory?: () => void;
}

export function BudgetDetail({
  budgetId,
  headerBg,
  budgetIcon,
  budgetName,
  budgetDescription,
  spentLabel = "Gastado",
  spentValue,
  percentBadgeText,
  progressPercent,
  progressColor,
  progressUsedLabel,
  progressRemainingLabel,
  subcategoriesTitle = "Subcategorías",
  addSubLabel = "Agregar",
  subcategories,
  loadingLabel = "Cargando budget...",
  emptyLabel = "No hay detalles para este budget.",
  onBackClick,
  onEditClick,
  onAddSubcategory,
}: BudgetDetailProps) {
  const {
    budgetFormValidationLabel,
    budgetNameInput,
    categoriesError,
    categoryColorOptions,
    categoryIconOptions,
    detailSubcategories,
    handleCloseEditor,
    handleCreateCategory,
    handleOpenEditor,
    handleSubmitEdit,
    isAmountValid,
    isBudgetNameValid,
    isCategoriesLoading,
    isEditorOpen,
    isEditorSubmitting,
    isEmpty,
    isFormValid,
    isLoading,
    isScopeValid,
    limitAmountInput,
    resolvedHeaderBg,
    resolvedBudgetDescription,
    resolvedBudgetIcon,
    resolvedBudgetName,
    resolvedPercentBadgeText,
    resolvedProgressColor,
    resolvedProgressPercent,
    resolvedProgressRemainingLabel,
    resolvedProgressTextColor,
    resolvedProgressUsedLabel,
    resolvedSpentValue,
    selectedScopeRules,
    setBudgetNameInput,
    setLimitAmountInput,
    setSelectedScopeRules,
    showValidation,
    sortedCategories,
  } = useBudgetDetailPageModel({
    budgetId,
    headerBg,
    budgetIcon,
    budgetName,
    budgetDescription,
    spentValue,
    percentBadgeText,
    progressPercent,
    progressColor,
    progressUsedLabel,
    progressRemainingLabel,
    subcategories,
  });

  const handleSubmitEditVoid = useCallback(() => { void handleSubmitEdit(); }, [handleSubmitEdit]);
  const handleEditClick = useCallback(() => {
    handleOpenEditor();
    onEditClick?.();
  }, [handleOpenEditor, onEditClick]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[var(--panel-bg)] px-5">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[var(--panel-bg)] px-5">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)]">
      <div className={`flex h-full flex-col ${isEditorOpen ? "pointer-events-none" : ""}`}>
        <BudgetHero
          headerBg={resolvedHeaderBg}
          icon={resolvedBudgetIcon}
          name={resolvedBudgetName}
          description={resolvedBudgetDescription}
          spentLabel={spentLabel}
          spentValue={resolvedSpentValue}
          percentBadgeText={resolvedPercentBadgeText}
          onBackClick={onBackClick}
          onEditClick={handleEditClick}
        />

        <div className="flex flex-col gap-2 px-5 pt-5">
          <BudgetDetailProgressWidget
            percent={resolvedProgressPercent}
            progressColor={resolvedProgressColor}
            usedLabel={resolvedProgressUsedLabel}
            remainingLabel={resolvedProgressRemainingLabel}
            usedTextColor={resolvedProgressTextColor}
          />
        </div>

        <div className="flex-1 overflow-auto p-5">
          <BudgetDetailSubcategoriesWidget
            subcategoriesTitle={subcategoriesTitle}
            addSubLabel={addSubLabel}
            items={detailSubcategories}
            emptyLabel={emptyLabel}
            onAddSubcategory={onAddSubcategory}
          />
        </div>
      </div>

      <BudgetQuickAddWidget
        isOpen={isEditorOpen}
        title="Editar budget"
        submitLabel="Guardar cambios"
        budgetNameLabel="Nombre del budget"
        budgetNamePlaceholder="Ej. Gastos fijos de casa"
        budgetNameErrorLabel="Agrega un nombre para el budget."
        budgetNameInput={budgetNameInput}
        budgetFormValidationLabel={budgetFormValidationLabel}
        categoryLabel="Categorías incluidas"
        categoryErrorLabel="Selecciona al menos una categoría y subcategoría válida."
        categoryCreateActionLabel="Nueva categoría"
        amountLabel="Monto límite"
        amountErrorLabel="Ingresa un monto mayor a 0."
        categories={sortedCategories}
        categoriesError={categoriesError}
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
        isLoading={isEditorSubmitting}
        onRequestClose={handleCloseEditor}
        onBudgetNameChange={setBudgetNameInput}
        onScopeRulesChange={setSelectedScopeRules}
        onCreateCategory={handleCreateCategory}
        onAmountChange={setLimitAmountInput}
        onSubmit={handleSubmitEditVoid}
      />

    </div>
  );
}
