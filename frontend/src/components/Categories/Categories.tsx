import { useMemo, useState } from "react";
import type { Category } from "@/types";
import {
  ActionButton,
  ExpandableListItem,
  IconBadge,
  PageHeader,
} from "@/components";
import { useCategories, useTransactions } from "@/hooks";

export interface CategoriesProps {
  headerTitle?: string;
  categories?: Category[];
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddSubmitLabel?: string;
  quickAddNameErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  inUseDeleteMessage?: string;
  deleteActionLabel?: string;
  deleteConfirmTitle?: string;
  deleteConfirmHint?: string;
  deleteCancelLabel?: string;
  deleteConfirmLabel?: string;
  checkingUsageLabel?: string;
  onBackClick?: () => void;
  onAddClick?: () => void;
  onCategoryClick?: (index: number) => void;
}

export function Categories({
  headerTitle = "Categorías",
  categories,
  quickAddTitle = "Nueva categoría",
  quickAddNameLabel = "Nombre",
  quickAddNamePlaceholder = "Ej. Salud",
  quickAddSubmitLabel = "Guardar categoría",
  quickAddNameErrorLabel = "Agrega un nombre corto.",
  loadingLabel = "Cargando categorías...",
  emptyTitle = "No hay categorías",
  emptyHint = "Agrega tu primera categoría para organizar tus movimientos.",
  errorLabel = "No pudimos cargar las categorías. Intenta nuevamente.",
  inUseDeleteMessage = "This category is in use and can’t be deleted yet.",
  deleteActionLabel = "Delete",
  deleteConfirmTitle = "Delete this category?",
  deleteConfirmHint = "This can’t be undone.",
  deleteCancelLabel = "Cancel",
  deleteConfirmLabel = "Delete",
  checkingUsageLabel = "Checking transactions...",
  onBackClick,
  onAddClick,
  onCategoryClick,
}: CategoriesProps) {
  const {
    items: storedCategories,
    isLoading,
    error,
    create,
    remove,
  } = useCategories();
  const {
    items: transactions,
    isLoading: isTransactionsLoading,
  } = useTransactions();

  const isUsingExternalCategories = Array.isArray(categories);
  const resolvedCategories = categories ?? storedCategories;

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [categoryNameInput, setCategoryNameInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteConfirmCategoryId, setDeleteConfirmCategoryId] = useState<string | null>(null);

  const usageCountByCategoryId = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (!transaction.categoryId) {
        return;
      }

      map.set(
        transaction.categoryId,
        (map.get(transaction.categoryId) ?? 0) + 1,
      );
    });

    return map;
  }, [transactions]);

  const normalizedCategoryName = categoryNameInput.trim();
  const isCategoryNameValid = normalizedCategoryName.length > 0;

  const closeQuickAdd = () => {
    setIsQuickAddOpen(false);
    setCategoryNameInput("");
    setShowValidation(false);
  };

  const handleHeaderAction = () => {
    if (isQuickAddOpen) {
      closeQuickAdd();
    } else {
      setIsQuickAddOpen(true);
      setShowValidation(false);
    }

    setStatusMessage(null);
    onAddClick?.();
  };

  const handleToggle = (index: number) => {
    const isExpanding = expandedIndex !== index;
    setExpandedIndex(isExpanding ? index : null);
    setStatusMessage(null);
    setDeleteConfirmCategoryId(null);
    if (isExpanding) {
      onCategoryClick?.(index);
    }
  };

  const handleCreateCategory = async () => {
    setShowValidation(true);
    if (!isCategoryNameValid || isUsingExternalCategories) {
      return;
    }

    const created = await create({
      name: normalizedCategoryName,
    });

    if (!created) {
      return;
    }

    closeQuickAdd();
    setStatusMessage(null);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!category.id || isUsingExternalCategories) {
      return;
    }

    if (isTransactionsLoading) {
      setStatusMessage(checkingUsageLabel);
      return;
    }

    const usageCount = usageCountByCategoryId.get(category.id) ?? 0;
    if (usageCount > 0) {
      setStatusMessage(inUseDeleteMessage);
      setDeleteConfirmCategoryId(null);
      return;
    }

    const removed = await remove(category.id);
    if (!removed) {
      setStatusMessage(errorLabel);
      return;
    }

    setStatusMessage(null);
    setDeleteConfirmCategoryId(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={isUsingExternalCategories ? undefined : handleHeaderAction}
        actionIcon={isQuickAddOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="flex flex-col gap-4">
          {isQuickAddOpen && !isUsingExternalCategories && (
            <div className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
                {quickAddTitle}
              </span>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddNameLabel}</span>
                <input
                  type="text"
                  value={categoryNameInput}
                  onChange={(event) => setCategoryNameInput(event.target.value)}
                  placeholder={quickAddNamePlaceholder}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isCategoryNameValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {quickAddNameErrorLabel}
                  </span>
                )}
              </label>

              <ActionButton
                icon="plus"
                label={quickAddSubmitLabel}
                iconColor="text-white"
                labelColor="text-white"
                bg={isCategoryNameValid && !isLoading ? "bg-black" : "bg-[#A1A1AA]"}
                padding="px-4 py-3"
                className={isCategoryNameValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
                onClick={() => {
                  void handleCreateCategory();
                }}
              />
            </div>
          )}

          {statusMessage && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-3">
              <span className="text-sm font-medium text-[#71717A]">{statusMessage}</span>
            </div>
          )}

          {isLoading && resolvedCategories.length === 0 && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            </div>
          )}

          {!isLoading && !isUsingExternalCategories && error && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            </div>
          )}

          {!isLoading && resolvedCategories.length === 0 && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="block text-sm font-semibold text-black font-['Outfit']">
                {emptyTitle}
              </span>
              <span className="block text-xs font-medium text-[#71717A] mt-1">
                {emptyHint}
              </span>
            </div>
          )}

          {resolvedCategories.map((category, index) => {
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
                left={
                  <IconBadge
                    icon={category.icon}
                    bg={category.iconBg}
                    size="w-[40px] h-[40px]"
                    rounded="rounded-xl"
                  />
                }
                title={category.name}
                subtitle={`${subcategoryCount} subcategorías`}
                titleClassName="text-base font-semibold text-black font-['Outfit']"
                subtitleClassName="text-xs font-medium text-[#71717A]"
                isExpanded={expandedIndex === index}
                onToggle={() => handleToggle(index)}
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
                          In use in {usageCount} transaction{usageCount === 1 ? "" : "s"}.
                        </span>
                      )}

                      {deleteConfirmCategoryId !== categoryId ? (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmCategoryId(categoryId)}
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
                              onClick={() => setDeleteConfirmCategoryId(null)}
                              className="px-3 py-1.5 rounded-lg bg-[#F4F4F5] text-xs font-medium text-[#52525B]"
                            >
                              {deleteCancelLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleDeleteCategory(category);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-black text-xs font-medium text-white"
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
        </div>
      </div>
    </div>
  );
}
