import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BudgetCategoryColorOption,
  BudgetCategoryOption,
  BudgetCreateCategoryInput,
} from "@/hooks";
import {
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
} from "@/utils";
import { ActionButton } from "../ActionButton/ActionButton";
import { CategoryColorPicker } from "../CategoryColorPicker/CategoryColorPicker";
import { CategoryIconPicker } from "../CategoryIconPicker/CategoryIconPicker";
import { IconBadge } from "../IconBadge/IconBadge";
import {
  OptionPickerSheet,
  type OptionPickerItem,
} from "../OptionPickerSheet/OptionPickerSheet";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";

const CREATE_CATEGORY_OPTION_ID = "__create_budget_category__";

export interface BudgetQuickAddWidgetProps {
  amountErrorLabel: string;
  amountLabel: string;
  budgetFormValidationLabel?: string | null;
  budgetNameErrorLabel?: string;
  budgetNameInput: string;
  budgetNameLabel?: string;
  budgetNamePlaceholder?: string;
  categories: BudgetCategoryOption[];
  categoriesError?: string | null;
  categoryColorOptions: BudgetCategoryColorOption[];
  categoryCreateActionLabel?: string;
  categoryErrorLabel: string;
  categoryIconOptions: string[];
  categoryLabel: string;
  isAmountValid: boolean;
  isBudgetNameValid: boolean;
  isCategoriesLoading?: boolean;
  isCategoryValid: boolean;
  isDuplicateCategoryMonth?: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isOpen: boolean;
  limitAmountInput: string;
  onAmountChange: (value: string) => void;
  onBudgetNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCreateCategory: (input: BudgetCreateCategoryInput) => Promise<BudgetCategoryOption | null>;
  onRequestClose?: () => void;
  onSubmit: () => void;
  selectedCategoryId: string;
  showValidation: boolean;
  submitLabel: string;
  title: string;
}

export function BudgetQuickAddWidget({
  amountErrorLabel,
  amountLabel,
  budgetFormValidationLabel = null,
  budgetNameErrorLabel = "Agrega un nombre para el budget.",
  budgetNameInput,
  budgetNameLabel = "Nombre del budget",
  budgetNamePlaceholder = "Ej. Gastos fijos de casa",
  categories,
  categoriesError = null,
  categoryColorOptions,
  categoryCreateActionLabel = "Nueva categoría",
  categoryErrorLabel,
  categoryIconOptions,
  categoryLabel,
  isAmountValid,
  isBudgetNameValid,
  isCategoriesLoading = false,
  isCategoryValid,
  isDuplicateCategoryMonth = false,
  isFormValid,
  isLoading,
  isOpen,
  limitAmountInput,
  onAmountChange,
  onBudgetNameChange,
  onCategoryChange,
  onCreateCategory,
  onRequestClose,
  onSubmit,
  selectedCategoryId,
  showValidation,
  submitLabel,
  title,
}: BudgetQuickAddWidgetProps) {
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState<boolean>(false);
  const [createCategoryNameInput, setCreateCategoryNameInput] = useState<string>("");
  const [createCategoryIcon, setCreateCategoryIcon] = useState<string>(DEFAULT_CATEGORY_ICON);
  const [createCategoryColorKey, setCreateCategoryColorKey] = useState<string>(DEFAULT_CATEGORY_COLOR_KEY);
  const [showCreateCategoryValidation, setShowCreateCategoryValidation] = useState<boolean>(false);
  const [isCreateCategorySubmitting, setIsCreateCategorySubmitting] = useState<boolean>(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const categoryPickerItems = useMemo<OptionPickerItem[]>(() => {
    const items = categories.map((category) => ({
      id: category.id,
      label: category.name,
      icon: category.icon,
      iconBg: category.iconBg,
    }));

    items.push({
      id: CREATE_CATEGORY_OPTION_ID,
      label: categoryCreateActionLabel,
      icon: "plus",
      iconBg: "bg-[var(--surface-border)]",
      subtitle: "Crear una categoría nueva",
    });

    return items;
  }, [categories, categoryCreateActionLabel]);

  const resetCreateCategoryDraft = useCallback(() => {
    setCreateCategoryNameInput("");
    setCreateCategoryIcon(DEFAULT_CATEGORY_ICON);
    setCreateCategoryColorKey(DEFAULT_CATEGORY_COLOR_KEY);
    setShowCreateCategoryValidation(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setIsCategoryPickerOpen(false);
    setIsCreateCategoryOpen(false);
    resetCreateCategoryDraft();
  }, [isOpen, resetCreateCategoryDraft]);

  const canOpenCategoryPicker = !isCategoriesLoading;

  const normalizedCreateCategoryName = createCategoryNameInput.trim();
  const previewCategoryName = normalizedCreateCategoryName.length > 0
    ? normalizedCreateCategoryName
    : "Vista previa";
  const previewCategoryColorClass = categoryColorOptions.find(
    (option) => option.key === createCategoryColorKey,
  )?.swatchClass ?? "bg-[#71717A]";
  const isCreateCategoryNameValid = normalizedCreateCategoryName.length > 0;
  const isCreateCategoryIconValid = createCategoryIcon.trim().length > 0;
  const isCreateCategoryColorValid = categoryColorOptions.some((option) => option.key === createCategoryColorKey);
  const isCreateCategoryFormValid = isCreateCategoryNameValid
    && isCreateCategoryIconValid
    && isCreateCategoryColorValid;

  const handleCreateCategorySubmit = () => {
    void (async () => {
      setShowCreateCategoryValidation(true);
      if (!isCreateCategoryFormValid || isCreateCategorySubmitting) {
        return;
      }

      setIsCreateCategorySubmitting(true);
      try {
        const created = await onCreateCategory({
          name: normalizedCreateCategoryName,
          icon: createCategoryIcon,
          colorKey: createCategoryColorKey,
        });

        if (!created) {
          return;
        }

        setIsCreateCategoryOpen(false);
        resetCreateCategoryDraft();
      } finally {
        setIsCreateCategorySubmitting(false);
      }
    })();
  };

  const closeCreateCategorySheet = () => {
    setIsCreateCategoryOpen(false);
    resetCreateCategoryDraft();
  };

  return (
    <>
      <SlideUpSheet
        isOpen={isOpen}
        title={title}
        onRequestClose={onRequestClose}
        onSubmit={onSubmit}
        backdropAriaLabel="Cerrar formulario de budget"
        handleAriaLabel="Desliza hacia arriba para cerrar"
        footer={(
          <ActionButton
            type="submit"
            icon="plus"
            label={isLoading ? "Guardando..." : submitLabel}
            iconColor="text-[var(--text-primary)]"
            labelColor="text-[var(--text-primary)]"
            bg={isFormValid && !isLoading ? "bg-[var(--surface-border)]" : "bg-[var(--surface-muted)]"}
            padding="px-4 py-3"
            className={isFormValid && !isLoading ? "" : "opacity-70"}
            disabled={!isFormValid || isLoading}
          />
        )}
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{budgetNameLabel}</span>
            <input
              type="text"
              value={budgetNameInput}
              onChange={(event) => onBudgetNameChange(event.target.value)}
              placeholder={budgetNamePlaceholder}
              className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
            />
            {showValidation && !isBudgetNameValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{budgetNameErrorLabel}</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{categoryLabel}</span>
            <button
              type="button"
              onClick={() => {
                if (canOpenCategoryPicker) {
                  setIsCategoryPickerOpen(true);
                }
              }}
              disabled={!canOpenCategoryPicker}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                canOpenCategoryPicker ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <div className="min-w-0 flex items-center gap-2">
                {selectedCategory && (
                  <IconBadge
                    icon={selectedCategory.icon}
                    bg={selectedCategory.iconBg}
                    size="h-[28px] w-[28px]"
                    rounded="rounded-lg"
                  />
                )}
                <span className="truncate">{selectedCategory?.name ?? "Selecciona una categoría"}</span>
              </div>
              <PhosphorIcon name="caret-right" size="text-[16px]" className="text-[var(--text-secondary)]" />
            </button>

            {showValidation && !isCategoryValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{categoryErrorLabel}</span>
            )}
            {showValidation && isDuplicateCategoryMonth && budgetFormValidationLabel && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{budgetFormValidationLabel}</span>
            )}
            {isCategoriesLoading && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Cargando categorías...</span>
            )}
            {categoriesError && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">No pudimos cargar las categorías.</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{amountLabel}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={limitAmountInput}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[#A1A1AA]"
            />
            {showValidation && !isAmountValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {amountErrorLabel}
              </span>
            )}
          </label>
        </div>
      </SlideUpSheet>

      <OptionPickerSheet
        isOpen={isCategoryPickerOpen}
        title="Seleccionar categoría"
        items={categoryPickerItems}
        selectedId={selectedCategoryId || null}
        isLoading={isCategoriesLoading}
        errorMessage={categoriesError}
        emptyLabel="Sin categorías"
        onRequestClose={() => {
          setIsCategoryPickerOpen(false);
        }}
        onSelect={(item) => {
          if (item.id === CREATE_CATEGORY_OPTION_ID) {
            setIsCategoryPickerOpen(false);
            setIsCreateCategoryOpen(true);
            return;
          }

          onCategoryChange(item.id);
          setIsCategoryPickerOpen(false);
        }}
      />

      <SlideUpSheet
        isOpen={isCreateCategoryOpen}
        title="Nueva categoría"
        onRequestClose={closeCreateCategorySheet}
        onSubmit={handleCreateCategorySubmit}
        backdropAriaLabel="Cerrar formulario de categoría"
        handleAriaLabel="Desliza hacia arriba para cerrar"
        footer={(
          <ActionButton
            type="submit"
            icon="plus"
            label={isCreateCategorySubmitting ? "Guardando..." : "Guardar categoría"}
            iconColor="text-[var(--text-primary)]"
            labelColor="text-[var(--text-primary)]"
            bg={isCreateCategoryFormValid && !isCreateCategorySubmitting
              ? "bg-[var(--surface-border)]"
              : "bg-[var(--surface-muted)]"}
            padding="px-4 py-3"
            className={isCreateCategoryFormValid && !isCreateCategorySubmitting ? "" : "opacity-70"}
            disabled={!isCreateCategoryFormValid || isCreateCategorySubmitting}
          />
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] p-3">
            <IconBadge
              icon={createCategoryIcon}
              bg={previewCategoryColorClass}
              size="h-[40px] w-[40px]"
              rounded="rounded-xl"
            />
            <div className="min-w-0">
              <span className="block truncate font-['Outfit'] text-sm font-semibold text-[var(--text-primary)]">
                {previewCategoryName}
              </span>
              <span className="block text-xs font-medium text-[var(--text-secondary)]">Categoría</span>
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Nombre</span>
            <input
              type="text"
              value={createCategoryNameInput}
              onChange={(event) => setCreateCategoryNameInput(event.target.value)}
              placeholder="Ej. Salud"
              className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
            />
            {showCreateCategoryValidation && !isCreateCategoryNameValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                Agrega un nombre corto.
              </span>
            )}
          </label>

          <CategoryIconPicker
            options={categoryIconOptions}
            selectedIcon={createCategoryIcon}
            onChange={setCreateCategoryIcon}
            label="Ícono"
            showValidation={showCreateCategoryValidation}
            isValid={isCreateCategoryIconValid}
            errorLabel="Selecciona un ícono."
          />

          <CategoryColorPicker
            options={categoryColorOptions}
            selectedColorKey={createCategoryColorKey}
            onChange={setCreateCategoryColorKey}
            label="Color"
            showValidation={showCreateCategoryValidation}
            isValid={isCreateCategoryColorValid}
            errorLabel="Selecciona un color."
          />
        </div>
      </SlideUpSheet>
    </>
  );
}
