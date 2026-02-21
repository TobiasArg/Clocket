import type { SubcategoryItem } from "@/types";
import {
  CardSection,
  CategoryItem,
  PhosphorIcon,
  TextBadge,
} from "@/components";

export interface BudgetDetailSubcategoriesWidgetProps {
  addSubLabel?: string;
  emptyLabel?: string;
  items?: SubcategoryItem[];
  onAddSubcategory?: () => void;
  subcategoriesTitle?: string;
}

export function BudgetDetailSubcategoriesWidget({
  addSubLabel = "Agregar",
  emptyLabel = "No hay detalles para este budget.",
  items = [],
  onAddSubcategory,
  subcategoriesTitle = "Subcategorías",
}: BudgetDetailSubcategoriesWidgetProps) {
  return (
    <CardSection
      title={subcategoriesTitle}
      action={(
        <button
          type="button"
          onClick={onAddSubcategory}
          className="flex items-center gap-1.5 bg-[var(--surface-muted)] rounded-xl px-3 py-2"
          aria-label={addSubLabel}
        >
          <PhosphorIcon name="plus" size="text-[16px]" className="text-[var(--text-primary)]" />
          <TextBadge
            text={addSubLabel}
            bg=""
            textColor="text-[var(--text-primary)]"
            padding=""
            rounded=""
            fontSize="text-xs"
            fontWeight="font-semibold"
          />
        </button>
      )}
    >
      <div className="flex flex-col gap-3">
        {items.length === 0 && (
          <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
        )}

        {items.map((sub) => (
          <CategoryItem
            key={sub.name}
            dotColor={sub.dotColor}
            name={sub.name}
            value={sub.amount}
            secondaryValue={sub.percent}
            nameClassName="text-[15px] font-semibold text-[var(--text-primary)] font-['Outfit']"
            valueClassName="text-[15px] font-bold text-[var(--text-primary)] font-['Outfit']"
            secondaryClassName="text-xs font-medium text-[var(--text-secondary)]"
            progress={{
              percent: sub.barWidthPercent,
              barColor: sub.barColor,
              trackColor: "bg-[var(--surface-border)]",
              barHeight: "h-1.5",
            }}
            containerClassName="bg-[var(--surface-muted)] rounded-2xl p-4"
          />
        ))}
      </div>
    </CardSection>
  );
}
