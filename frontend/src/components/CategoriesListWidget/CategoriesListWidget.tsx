import { memo } from "react";
import type { Category } from "@/types";
import { IconBadge } from "../IconBadge/IconBadge";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";

export interface CategoriesListWidgetProps {
  categories?: Category[];
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  hasError?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  onCategorySelect?: (index: number) => void;
  statusMessage?: string | null;
}

export const CategoriesListWidget = memo(function CategoriesListWidget({
  categories = [],
  emptyHint = "Agrega tu primera categoría para organizar tus movimientos.",
  emptyTitle = "No hay categorías",
  errorLabel = "No pudimos cargar las categorías. Intenta nuevamente.",
  hasError = false,
  isLoading = false,
  loadingLabel = "Cargando categorías...",
  onCategorySelect,
  statusMessage = null,
}: CategoriesListWidgetProps) {
  return (
    <>
      {statusMessage && (
        <div className="clocket-glass-card rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{statusMessage}</span>
        </div>
      )}

      {isLoading && categories.length === 0 && (
        <div className="clocket-glass-card rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
        </div>
      )}

      {!isLoading && hasError && (
        <div className="clocket-glass-card rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
        </div>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="clocket-glass-card rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
          <span className="block text-sm font-semibold text-[var(--text-primary)] font-['Outfit']">
            {emptyTitle}
          </span>
          <span className="block text-xs font-medium text-[var(--text-secondary)] mt-1">
            {emptyHint}
          </span>
        </div>
      )}

      {categories.map((category, index) => {
        const subcategoryList = Array.isArray(category.subcategories)
          ? category.subcategories
          : [];
        const subcategoryCount = subcategoryList.length > 0
          ? subcategoryList.length
          : category.subcategoryCount;

        return (
          <button
            key={category.id ?? `${category.name}-${index}`}
            type="button"
            aria-label={category.name}
            onClick={() => onCategorySelect?.(index)}
            className="clocket-glass-card flex w-full items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-3 py-3 text-left"
          >
            <IconBadge
              icon={category.icon}
              bg={category.iconBg}
              size="w-[40px] h-[40px]"
              rounded="rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold text-[var(--text-primary)] font-['Outfit']">
                {category.name}
              </span>
              <span className="block text-xs font-medium text-[var(--text-secondary)]">
                {subcategoryCount} subcategorías
              </span>
            </div>
            <PhosphorIcon name="caret-right" className="text-[var(--text-secondary)]" />
          </button>
        );
      })}
    </>
  );
});
