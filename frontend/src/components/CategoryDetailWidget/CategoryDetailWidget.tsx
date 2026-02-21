import type { Category } from "@/types";
import { IconBadge } from "../IconBadge/IconBadge";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";

export interface CategoryDetailWidgetProps {
  category?: Category | null;
  checkingUsageLabel?: string;
  deleteActionLabel?: string;
  deleteCancelLabel?: string;
  deleteConfirmCategoryId?: string | null;
  deleteConfirmHint?: string;
  deleteConfirmLabel?: string;
  deleteConfirmTitle?: string;
  inUseDeleteMessage?: string;
  isOpen?: boolean;
  isTransactionsLoading?: boolean;
  isUsingExternalCategories?: boolean;
  onDeleteCategory?: (category: Category) => void;
  onDeleteConfirmCategoryIdChange?: (value: string | null) => void;
  onRequestClose?: () => void;
  usageCount?: number;
}

export function CategoryDetailWidget({
  category = null,
  checkingUsageLabel = "Verificando transacciones...",
  deleteActionLabel = "Eliminar",
  deleteCancelLabel = "Cancelar",
  deleteConfirmCategoryId = null,
  deleteConfirmHint = "No se puede deshacer.",
  deleteConfirmLabel = "Eliminar",
  deleteConfirmTitle = "¿Eliminar esta categoría?",
  inUseDeleteMessage = "Esta categoría está en uso y no puede eliminarse aún.",
  isOpen = false,
  isTransactionsLoading = false,
  isUsingExternalCategories = false,
  onDeleteCategory,
  onDeleteConfirmCategoryIdChange,
  onRequestClose,
  usageCount = 0,
}: CategoryDetailWidgetProps) {
  if (!isOpen || !category) {
    return null;
  }

  const subcategoryList = Array.isArray(category.subcategories) ? category.subcategories : [];
  const subcategoryCount = subcategoryList.length > 0 ? subcategoryList.length : category.subcategoryCount;
  const categoryId = category.id ?? null;
  const isDeleteConfirmOpen = categoryId !== null && deleteConfirmCategoryId === categoryId;
  const isCategoryInUse = usageCount > 0;
  const canManageCategory = !isUsingExternalCategories && categoryId !== null;

  return (
    <SlideUpSheet
      isOpen={isOpen}
      title={category.name}
      onRequestClose={onRequestClose}
      backdropAriaLabel="Cerrar detalle de categoría"
      handleAriaLabel="Desliza hacia arriba para cerrar"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] p-3">
          <IconBadge
            icon={category.icon}
            bg={category.iconBg}
            size="h-[40px] w-[40px]"
            rounded="rounded-xl"
          />
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)] font-['Outfit']">
              {category.name}
            </span>
            <span className="block text-xs font-medium text-[var(--text-secondary)]">
              {subcategoryCount} subcategorías
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-3">
          <span className="block text-[11px] font-semibold tracking-[1px] text-[var(--text-secondary)]">
            SUBCATEGORÍAS
          </span>
          <div className="mt-2 flex flex-col">
            {subcategoryList.length > 0 ? (
              subcategoryList.map((subcategory, index) => (
                <div
                  key={`${subcategory}-${index}`}
                  className={`py-2 ${index < subcategoryList.length - 1 ? "border-b border-[var(--surface-border)]" : ""}`}
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">{subcategory}</span>
                </div>
              ))
            ) : (
              <span className="py-2 text-xs font-medium text-[var(--text-secondary)]">
                Sin subcategorías
              </span>
            )}
          </div>
        </div>

        {canManageCategory && (
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-3">
            <span className="block text-[11px] font-semibold tracking-[1px] text-[var(--text-secondary)]">
              ACCIONES
            </span>

            <div className="mt-2 flex flex-col gap-2">
              {isTransactionsLoading && (
                <span className="text-xs font-medium text-[var(--text-secondary)]">{checkingUsageLabel}</span>
              )}

              {!isTransactionsLoading && isCategoryInUse && (
                <>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Usada en {usageCount} {usageCount === 1 ? "transacción" : "transacciones"}.
                  </span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{inUseDeleteMessage}</span>
                </>
              )}

              {!isTransactionsLoading && !isCategoryInUse && !isDeleteConfirmOpen && (
                <button
                  type="button"
                  onClick={() => onDeleteConfirmCategoryIdChange?.(categoryId)}
                  className="w-fit rounded-lg bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                >
                  {deleteActionLabel}
                </button>
              )}

              {!isTransactionsLoading && !isCategoryInUse && isDeleteConfirmOpen && (
                <div className="flex flex-col gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-3">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{deleteConfirmTitle}</span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{deleteConfirmHint}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDeleteConfirmCategoryIdChange?.(null)}
                      className="rounded-lg bg-[var(--panel-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
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
          </div>
        )}
      </div>
    </SlideUpSheet>
  );
}
