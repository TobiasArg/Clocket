import type { Category } from "@/types";
import { ExpandableListItem } from "@/components";
import { IconBadge } from "../IconBadge/IconBadge";

export interface CategoriesListWidgetProps {
  categories?: Category[];
  checkingUsageLabel?: string;
  deleteActionLabel?: string;
  deleteCancelLabel?: string;
  deleteConfirmCategoryId?: string | null;
  deleteConfirmHint?: string;
  deleteConfirmLabel?: string;
  deleteConfirmTitle?: string;
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  expandedIndex?: number | null;
  hasError?: boolean;
  inUseLabelPrefix?: string;
  isLoading?: boolean;
  isUsingExternalCategories?: boolean;
  loadingLabel?: string;
  onDeleteCategory?: (category: Category) => void;
  onDeleteConfirmCategoryIdChange?: (value: string | null) => void;
  onToggle?: (index: number) => void;
  statusMessage?: string | null;
  usageCountByCategoryId?: Map<string, number>;
}

export function CategoriesListWidget({
  categories = [],
  deleteActionLabel = "Eliminar",
  deleteCancelLabel = "Cancelar",
  deleteConfirmCategoryId = null,
  deleteConfirmHint = "No se puede deshacer.",
  deleteConfirmLabel = "Eliminar",
  deleteConfirmTitle = "¿Eliminar esta categoría?",
  emptyHint = "Agrega tu primera categoría para organizar tus movimientos.",
  emptyTitle = "No hay categorías",
  errorLabel = "No pudimos cargar las categorías. Intenta nuevamente.",
  expandedIndex = 0,
  hasError = false,
  inUseLabelPrefix = "Usada en",
  isLoading = false,
  isUsingExternalCategories = false,
  loadingLabel = "Cargando categorías...",
  onDeleteCategory,
  onDeleteConfirmCategoryIdChange,
  onToggle,
  statusMessage = null,
  usageCountByCategoryId = new Map<string, number>(),
}: CategoriesListWidgetProps) {
  return (
    <>
      {statusMessage && (
        <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{statusMessage}</span>
        </div>
      )}

      {isLoading && categories.length === 0 && (
        <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
        </div>
      )}

      {!isLoading && hasError && (
        <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
        </div>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
          <span className="block font-['Outfit'] text-sm font-semibold text-[var(--text-primary)]">
            {emptyTitle}
          </span>
          <span className="mt-1 block text-xs font-medium text-[var(--text-secondary)]">
            {emptyHint}
          </span>
        </div>
      )}

      {categories.map((category, index) => {
        const categoryId = category.id;
        const usageCount = categoryId
          ? (usageCountByCategoryId.get(categoryId) ?? 0)
          : 0;
        const subcategoryList = Array.isArray(category.subcategories)
          ? category.subcategories
          : [];
        const subcategoryCount = subcategoryList.length > 0
          ? subcategoryList.length
          : category.subcategoryCount;

        return (
          <ExpandableListItem
            key={categoryId ?? `${category.name}-${index}`}
            left={(
              <IconBadge
                icon={category.icon}
                bg={category.iconBg}
                size="w-[40px] h-[40px]"
                rounded="rounded-xl"
              />
            )}
            title={category.name}
            subtitle={`${subcategoryCount} subcategorías`}
            titleClassName="font-['Outfit'] text-base font-semibold text-[var(--text-primary)]"
            subtitleClassName="text-xs font-medium text-[var(--text-secondary)]"
            isExpanded={expandedIndex === index}
            onToggle={() => onToggle?.(index)}
          >
            <div className="flex flex-col pb-2 pl-[52px]">
              {subcategoryList.length > 0 ? (
                subcategoryList.map((sub, subIndex) => (
                  <div
                    key={sub}
                    className={`py-3 ${subIndex < subcategoryList.length - 1 ? "border-b border-[var(--surface-border)]" : ""}`}
                  >
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{sub}</span>
                  </div>
                ))
              ) : (
                <span className="py-2 text-xs font-medium text-[var(--text-secondary)]">
                  Sin subcategorías
                </span>
              )}

              {!isUsingExternalCategories && categoryId && (
                <div className="flex flex-col gap-2 pt-2">
                  {usageCount > 0 && (
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                      {inUseLabelPrefix} {usageCount} {usageCount === 1 ? "transacción" : "transacciones"}.
                    </span>
                  )}

                  {deleteConfirmCategoryId !== categoryId ? (
                    <button
                      type="button"
                      onClick={() => onDeleteConfirmCategoryIdChange?.(categoryId)}
                      className="w-fit text-xs font-medium text-[var(--text-secondary)]"
                    >
                      {deleteActionLabel}
                    </button>
                  ) : (
                    <div className="flex max-w-[280px] flex-col gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-3">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{deleteConfirmTitle}</span>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{deleteConfirmHint}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onDeleteConfirmCategoryIdChange?.(null)}
                          className="rounded-lg bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                        >
                          {deleteCancelLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory?.(category)}
                          className="rounded-lg bg-[var(--surface-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
                        >
                          {deleteConfirmLabel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ExpandableListItem>
        );
      })}
    </>
  );
}
