import type { Category } from "@/types";
import { IconBadge } from "../IconBadge/IconBadge";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";

export interface CategoryDetailWidgetProps {
  addSubcategoryActionLabel?: string;
  addSubcategoryPlaceholder?: string;
  categoryDeleteLabel?: string;
  category?: Category | null;
  checkingUsageLabel?: string;
  deleteCancelLabel?: string;
  deleteConfirmCategoryId?: string | null;
  deleteConfirmHint?: string;
  deleteConfirmLabel?: string;
  deleteConfirmTitle?: string;
  isLoading?: boolean;
  isOpen?: boolean;
  isSubcategoryNameValid?: boolean;
  isTransactionsLoading?: boolean;
  isUsingExternalCategories?: boolean;
  notInUseLabel?: string;
  onAddSubcategory?: () => void;
  onDeleteCategory?: (category: Category) => void;
  onDeleteConfirmCategoryIdChange?: (value: string | null) => void;
  onDeleteSubcategory?: (subcategoryName: string) => void;
  onRequestClose?: () => void;
  onSubcategoryNameInputChange?: (value: string) => void;
  removeSubcategoryAriaLabel?: string;
  subcategoryNameInput?: string;
  usageLabel?: string;
  usageCount?: number;
}

export function CategoryDetailWidget({
  addSubcategoryActionLabel = "Agregar",
  addSubcategoryPlaceholder = "Nueva subcategoría",
  categoryDeleteLabel = "Eliminar categoría",
  category = null,
  checkingUsageLabel = "Verificando transacciones...",
  deleteCancelLabel = "Cancelar",
  deleteConfirmCategoryId = null,
  deleteConfirmHint = "No se puede deshacer.",
  deleteConfirmLabel = "Eliminar",
  deleteConfirmTitle = "¿Eliminar esta categoría?",
  isLoading = false,
  isOpen = false,
  isSubcategoryNameValid = false,
  isTransactionsLoading = false,
  isUsingExternalCategories = false,
  notInUseLabel = "No está en uso",
  onAddSubcategory,
  onDeleteCategory,
  onDeleteConfirmCategoryIdChange,
  onDeleteSubcategory,
  onRequestClose,
  onSubcategoryNameInputChange,
  removeSubcategoryAriaLabel = "Eliminar subcategoría",
  subcategoryNameInput = "",
  usageLabel = "En uso",
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
  const isDeleteDisabled = isLoading || isTransactionsLoading || isCategoryInUse;
  const resolvedUsageLabel = isTransactionsLoading
    ? checkingUsageLabel
    : (isCategoryInUse ? usageLabel : notInUseLabel);

  return (
    <SlideUpSheet
      isOpen={isOpen}
      // title={category.name}
      onRequestClose={onRequestClose}
      //backdropAriaLabel="Cerrar detalle de categoría"
      //handleAriaLabel="Desliza hacia arriba para cerrar"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] p-3">
          <IconBadge
            icon={category.icon}
            bg={category.iconBg}
            size="h-[40px] w-[40px]"
            rounded="rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <span className="block truncate pr-2 text-sm font-semibold text-[var(--text-primary)] font-['Outfit']">
              {category.name}
            </span>
            <span className="block text-xs font-medium text-[var(--text-secondary)]">
              {subcategoryCount} subcategorías
            </span>
          </div>
          {canManageCategory && !isDeleteConfirmOpen && (
            <button
              type="button"
              onClick={() => onDeleteConfirmCategoryIdChange?.(categoryId)}
              disabled={isDeleteDisabled}
              className={`shrink-0 self-center rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                isDeleteDisabled
                  ? "bg-[var(--surface-muted)] text-[var(--text-secondary)] opacity-70"
                  : "bg-[var(--surface-border)] text-[var(--text-secondary)]"
              }`}
            >
              {categoryDeleteLabel}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-3">
          <span className="block text-[11px] font-semibold tracking-[1px] text-[var(--text-secondary)]">
            SUBCATEGORÍAS
          </span>

          {canManageCategory && (
            <div className="mt-2 flex items-center gap-2">
              <IconBadge
                icon={category.icon}
                bg={category.iconBg}
                size="h-[30px] w-[30px]"
                rounded="rounded-lg"
              />
              <input
                type="text"
                value={subcategoryNameInput}
                onChange={(event) => onSubcategoryNameInputChange?.(event.target.value)}
                placeholder={addSubcategoryPlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
              />
              <button
                type="button"
                onClick={onAddSubcategory}
                disabled={isLoading || !isSubcategoryNameValid}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  isLoading || !isSubcategoryNameValid
                    ? "bg-[var(--surface-muted)] text-[var(--text-secondary)] opacity-70"
                    : "bg-[var(--surface-border)] text-[var(--text-primary)]"
                }`}
              >
                {addSubcategoryActionLabel}
              </button>
            </div>
          )}

          <div className="mt-2 flex flex-col">
            {subcategoryList.length > 0 ? (
              subcategoryList.map((subcategory, index) => (
                <div
                  key={`${subcategory}-${index}`}
                  className={`flex items-center justify-between gap-2 py-2 ${
                    index < subcategoryList.length - 1 ? "border-b border-[var(--surface-border)]" : ""
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <IconBadge
                      icon={category.icon}
                      bg={category.iconBg}
                      size="h-[26px] w-[26px]"
                      rounded="rounded-lg"
                    />
                    <span className="truncate text-sm font-medium text-[var(--text-primary)]">{subcategory}</span>
                  </div>

                  {canManageCategory && (
                    <button
                      type="button"
                      onClick={() => onDeleteSubcategory?.(subcategory)}
                      className="rounded-md bg-[var(--surface-muted)] p-1.5 text-[var(--text-secondary)]"
                      aria-label={`${removeSubcategoryAriaLabel}: ${subcategory}`}
                      disabled={isLoading}
                    >
                      <PhosphorIcon
                        name="trash-simple"
                        size="text-[11px]"
                        className="text-[var(--text-secondary)]"
                      />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <span className="py-2 text-xs font-medium text-[var(--text-secondary)]">
                Sin subcategorías
              </span>
            )}
          </div>
        </div>

        <div className="px-1">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">{resolvedUsageLabel}</span>
        </div>

        {canManageCategory && isDeleteConfirmOpen && (
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
                disabled={isDeleteDisabled}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isDeleteDisabled
                    ? "bg-[var(--surface-muted)] text-[var(--text-secondary)] opacity-70"
                    : "bg-[var(--surface-border)] text-[var(--text-primary)]"
                }`}
              >
                {deleteConfirmLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </SlideUpSheet>
  );
}
