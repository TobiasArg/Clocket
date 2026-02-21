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
        <div className="rounded-2xl bg-[#F4F4F5] px-4 py-3">
          <span className="text-sm font-medium text-[#71717A]">{statusMessage}</span>
        </div>
      )}

      {isLoading && categories.length === 0 && (
        <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
          <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
        </div>
      )}

      {!isLoading && hasError && (
        <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
          <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
        </div>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
          <span className="block text-sm font-semibold text-black font-['Outfit']">
            {emptyTitle}
          </span>
          <span className="block text-xs font-medium text-[#71717A] mt-1">
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
            titleClassName="text-base font-semibold text-black font-['Outfit']"
            subtitleClassName="text-xs font-medium text-[#71717A]"
            isExpanded={expandedIndex === index}
            onToggle={() => onToggle?.(index)}
          >
            <div className="pl-[52px] pb-2 flex flex-col">
              {subcategoryList.length > 0 ? (
                subcategoryList.map((sub, subIndex) => (
                  <div
                    key={sub}
                    className={`py-3 ${subIndex < subcategoryList.length - 1 ? "border-b border-[#F4F4F5]" : ""}`}
                  >
                    <span className="text-sm font-medium text-[#52525B]">{sub}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs font-medium text-[#A1A1AA] py-2">
                  Sin subcategorías
                </span>
              )}

              {!isUsingExternalCategories && categoryId && (
                <div className="pt-2 flex flex-col gap-2">
                  {usageCount > 0 && (
                    <span className="text-[11px] font-medium text-[#71717A]">
                      {inUseLabelPrefix} {usageCount} {usageCount === 1 ? "transacción" : "transacciones"}.
                    </span>
                  )}

                  {deleteConfirmCategoryId !== categoryId ? (
                    <button
                      type="button"
                      onClick={() => onDeleteConfirmCategoryIdChange?.(categoryId)}
                      className="w-fit text-xs font-medium text-[#71717A]"
                    >
                      {deleteActionLabel}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-white px-3 py-3 flex flex-col gap-2 max-w-[280px]">
                      <span className="text-xs font-semibold text-black">{deleteConfirmTitle}</span>
                      <span className="text-xs font-medium text-[#71717A]">{deleteConfirmHint}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onDeleteConfirmCategoryIdChange?.(null)}
                          className="px-3 py-1.5 rounded-lg bg-[#F4F4F5] text-xs font-medium text-[#52525B]"
                        >
                          {deleteCancelLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory?.(category)}
                          className="px-3 py-1.5 rounded-lg bg-[#E4E4E7] text-xs font-medium text-[#18181B]"
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
