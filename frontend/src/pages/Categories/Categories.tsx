import type { Category } from "@/modules/categories";
import {
  CategoriesListWidget,
  CategoryQuickAddWidget,
  PageHeader,
  useCategoriesPageModel,
} from "@/modules/categories";

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
  inUseDeleteMessage = "Esta categoría está en uso y no puede eliminarse aún.",
  deleteActionLabel = "Eliminar",
  deleteConfirmTitle = "¿Eliminar esta categoría?",
  deleteConfirmHint = "No se puede deshacer.",
  deleteCancelLabel = "Cancelar",
  deleteConfirmLabel = "Eliminar",
  checkingUsageLabel = "Verificando transacciones...",
  onBackClick,
  onAddClick,
  onCategoryClick,
}: CategoriesProps) {
  const {
    categoryNameInput,
    deleteConfirmCategoryId,
    expandedIndex,
    handleCreateCategory,
    handleDeleteCategory,
    handleHeaderAction,
    handleToggle,
    isCategoryNameValid,
    isLoading,
    isQuickAddOpen,
    isUsingExternalCategories,
    resolvedCategories,
    setCategoryNameInput,
    setDeleteConfirmCategoryId,
    showValidation,
    statusMessage,
    transactionsError,
    usageCountByCategoryId,
  } = useCategoriesPageModel({
    categories,
    checkingUsageLabel,
    errorLabel,
    inUseDeleteMessage,
    onAddClick,
    onCategoryClick,
  });

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
          <CategoryQuickAddWidget
            isOpen={isQuickAddOpen && !isUsingExternalCategories}
            title={quickAddTitle}
            nameLabel={quickAddNameLabel}
            namePlaceholder={quickAddNamePlaceholder}
            submitLabel={quickAddSubmitLabel}
            nameErrorLabel={quickAddNameErrorLabel}
            nameInput={categoryNameInput}
            showValidation={showValidation}
            isCategoryNameValid={isCategoryNameValid}
            isLoading={isLoading}
            onNameInputChange={setCategoryNameInput}
            onSubmit={() => {
              void handleCreateCategory();
            }}
          />

          <CategoriesListWidget
            categories={resolvedCategories}
            statusMessage={statusMessage}
            isLoading={isLoading}
            hasError={!isLoading && !isUsingExternalCategories && Boolean(transactionsError)}
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            expandedIndex={expandedIndex}
            onToggle={handleToggle}
            isUsingExternalCategories={isUsingExternalCategories}
            usageCountByCategoryId={usageCountByCategoryId}
            deleteActionLabel={deleteActionLabel}
            deleteConfirmCategoryId={deleteConfirmCategoryId}
            onDeleteConfirmCategoryIdChange={setDeleteConfirmCategoryId}
            deleteConfirmTitle={deleteConfirmTitle}
            deleteConfirmHint={deleteConfirmHint}
            deleteCancelLabel={deleteCancelLabel}
            deleteConfirmLabel={deleteConfirmLabel}
            onDeleteCategory={(category) => {
              void handleDeleteCategory(category);
            }}
          />
        </div>
      </div>
    </div>
  );
}
