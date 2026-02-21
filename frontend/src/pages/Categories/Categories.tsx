import type { Category } from "@/modules/categories";
import {
  CategoriesListWidget,
  CategoryDetailWidget,
  CategoryQuickAddWidget,
  PageHeader,
  useCategoriesPageModel,
} from "@/modules/categories";

export interface CategoriesProps {
  headerTitle?: string;
  categories?: Category[];
  quickAddTitle?: string;
  quickAddIconLabel?: string;
  quickAddColorLabel?: string;
  quickAddNameLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddSubmitLabel?: string;
  quickAddNameErrorLabel?: string;
  quickAddIconErrorLabel?: string;
  quickAddColorErrorLabel?: string;
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
  quickAddIconLabel = "Ícono",
  quickAddColorLabel = "Color",
  quickAddNameLabel = "Nombre",
  quickAddNamePlaceholder = "Ej. Salud",
  quickAddSubmitLabel = "Guardar categoría",
  quickAddNameErrorLabel = "Agrega un nombre corto.",
  quickAddIconErrorLabel = "Selecciona un ícono.",
  quickAddColorErrorLabel = "Selecciona un color.",
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
    colorOptions,
    categoryNameInput,
    deleteConfirmCategoryId,
    handleCloseCategoryDetail,
    handleCloseQuickAdd,
    handleCreateCategory,
    handleDeleteCategory,
    handleHeaderAction,
    handleOpenCategory,
    isCategoryDetailOpen,
    isCategoryNameValid,
    isColorValid,
    isFormValid,
    isIconValid,
    isLoading,
    isTransactionsLoading,
    isQuickAddOpen,
    isUsingExternalCategories,
    iconOptions,
    resolvedCategories,
    selectedColorKey,
    selectedIcon,
    selectedCategory,
    selectedCategoryUsageCount,
    setCategoryNameInput,
    setDeleteConfirmCategoryId,
    setSelectedColorKey,
    setSelectedIcon,
    showValidation,
    statusMessage,
    transactionsError,
  } = useCategoriesPageModel({
    categories,
    checkingUsageLabel,
    errorLabel,
    inUseDeleteMessage,
    onAddClick,
    onCategoryClick,
  });

  const isOverlayOpen = isQuickAddOpen || isCategoryDetailOpen;

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)] text-[var(--text-primary)]">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={isUsingExternalCategories ? undefined : handleHeaderAction}
        actionIcon={isQuickAddOpen ? "x" : "plus"}
      />
      <div className="relative flex-1 overflow-hidden">
        <div className={`h-full overflow-auto px-5 py-4 ${isOverlayOpen ? "pointer-events-none" : ""}`}>
          <div className="flex flex-col gap-4">
            <CategoriesListWidget
              categories={resolvedCategories}
              statusMessage={statusMessage}
              isLoading={isLoading}
              hasError={!isLoading && !isUsingExternalCategories && Boolean(transactionsError)}
              loadingLabel={loadingLabel}
              errorLabel={errorLabel}
              emptyTitle={emptyTitle}
              emptyHint={emptyHint}
              onCategorySelect={handleOpenCategory}
            />
          </div>
        </div>

        <CategoryDetailWidget
          isOpen={isCategoryDetailOpen}
          category={selectedCategory}
          usageCount={selectedCategoryUsageCount}
          isTransactionsLoading={isTransactionsLoading}
          isUsingExternalCategories={isUsingExternalCategories}
          checkingUsageLabel={checkingUsageLabel}
          inUseDeleteMessage={inUseDeleteMessage}
          deleteActionLabel={deleteActionLabel}
          deleteConfirmCategoryId={deleteConfirmCategoryId}
          onDeleteConfirmCategoryIdChange={setDeleteConfirmCategoryId}
          deleteConfirmTitle={deleteConfirmTitle}
          deleteConfirmHint={deleteConfirmHint}
          deleteCancelLabel={deleteCancelLabel}
          deleteConfirmLabel={deleteConfirmLabel}
          onRequestClose={handleCloseCategoryDetail}
          onDeleteCategory={(category) => {
            void handleDeleteCategory(category);
          }}
        />

        <CategoryQuickAddWidget
          isOpen={isQuickAddOpen && !isUsingExternalCategories}
          title={quickAddTitle}
          nameLabel={quickAddNameLabel}
          namePlaceholder={quickAddNamePlaceholder}
          submitLabel={quickAddSubmitLabel}
          nameErrorLabel={quickAddNameErrorLabel}
          iconLabel={quickAddIconLabel}
          colorLabel={quickAddColorLabel}
          iconErrorLabel={quickAddIconErrorLabel}
          colorErrorLabel={quickAddColorErrorLabel}
          nameInput={categoryNameInput}
          selectedIcon={selectedIcon}
          selectedColorKey={selectedColorKey}
          iconOptions={iconOptions}
          colorOptions={colorOptions}
          showValidation={showValidation}
          isCategoryNameValid={isCategoryNameValid}
          isIconValid={isIconValid}
          isColorValid={isColorValid}
          isFormValid={isFormValid}
          isLoading={isLoading}
          onNameInputChange={setCategoryNameInput}
          onIconChange={setSelectedIcon}
          onColorChange={setSelectedColorKey}
          onRequestClose={handleCloseQuickAdd}
          onSubmit={() => {
            void handleCreateCategory();
          }}
        />
      </div>
    </div>
  );
}
