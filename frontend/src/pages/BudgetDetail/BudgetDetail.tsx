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
  headerBg = "bg-[#DC2626]",
  budgetIcon,
  budgetName,
  budgetDescription,
  spentLabel = "Gastado",
  spentValue,
  percentBadgeText,
  progressPercent,
  progressColor = "bg-[#DC2626]",
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
    detailSubcategories,
    isEmpty,
    isLoading,
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
  } = useBudgetDetailPageModel({
    budgetId,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white px-5">
        <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white px-5">
        <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <BudgetHero
        headerBg={headerBg}
        icon={resolvedBudgetIcon}
        name={resolvedBudgetName}
        description={resolvedBudgetDescription}
        spentLabel={spentLabel}
        spentValue={resolvedSpentValue}
        percentBadgeText={resolvedPercentBadgeText}
        onBackClick={onBackClick}
        onEditClick={onEditClick}
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
  );
}
