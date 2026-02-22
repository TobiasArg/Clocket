import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "../ActionButton/ActionButton";
import {
  OptionPickerSheet,
  type OptionPickerItem,
} from "../OptionPickerSheet/OptionPickerSheet";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";
import type { AmountSign, TransactionsEditorMode } from "@/hooks";
import type { TransactionInputCurrency } from "@/utils";

const NONE_SUBCATEGORY_ID = "__none_subcategory__";

export interface TransactionEditorAccountOption {
  id: string;
  name: string;
}

export interface TransactionEditorCategoryOption {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  subcategories?: string[];
}

export interface TransactionEditorWidgetProps {
  accountsError?: string | null;
  categoriesError?: string | null;
  descriptionInput?: string;
  editorMode?: TransactionsEditorMode;
  editingAmountSign?: AmountSign;
  editSubmitLabel?: string;
  editTitle?: string;
  isAccountValid?: boolean;
  isAccountsLoading?: boolean;
  isAmountValid?: boolean;
  isCategoriesLoading?: boolean;
  isCategoryValid?: boolean;
  isFormValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  isDescriptionValid?: boolean;
  noAccountsLabel?: string;
  onAmountChange?: (value: string) => void;
  onCurrencyChange?: (value: TransactionInputCurrency) => void;
  onDescriptionChange?: (value: string) => void;
  onRequestClose?: () => void;
  onSelectedAccountIdChange?: (value: string) => void;
  onSelectedCategoryIdChange?: (value: string) => void;
  onSelectedSubcategoryNameChange?: (value: string) => void;
  onSignChange?: (value: AmountSign) => void;
  onSubmit?: () => void;
  quickAddAccountErrorLabel?: string;
  quickAddAccountLabel?: string;
  quickAddAmountErrorLabel?: string;
  quickAddAmountLabel?: string;
  quickAddAmountPlaceholder?: string;
  quickAddCategoryErrorLabel?: string;
  quickAddCategoryLabel?: string;
  quickAddCurrencyLabel?: string;
  quickAddDescriptionErrorLabel?: string;
  quickAddDescriptionLabel?: string;
  quickAddDescriptionPlaceholder?: string;
  quickAddExpenseLabel?: string;
  quickAddIncomeLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddTitle?: string;
  quickAddTypeLabel?: string;
  selectedAccountId?: string;
  selectedCategoryId?: string;
  selectedCurrency?: TransactionInputCurrency;
  selectedSubcategoryName?: string;
  showValidation?: boolean;
  sortedAccounts?: TransactionEditorAccountOption[];
  sortedCategories?: TransactionEditorCategoryOption[];
  uncategorizedAccountLabel?: string;
  uncategorizedLabel?: string;
  amountInput?: string;
}

const normalizeSubcategories = (subcategories: string[] | undefined): string[] => {
  if (!Array.isArray(subcategories)) {
    return [];
  }

  return subcategories
    .map((subcategory) => subcategory.trim())
    .filter((subcategory) => subcategory.length > 0);
};

export function TransactionEditorWidget({
  accountsError = null,
  amountInput = "",
  categoriesError = null,
  descriptionInput = "",
  editorMode = null,
  editingAmountSign = "-",
  editSubmitLabel = "Guardar cambios",
  editTitle = "Editar transacción",
  isAccountValid = false,
  isAccountsLoading = false,
  isAmountValid = false,
  isCategoriesLoading = false,
  isCategoryValid = false,
  isDescriptionValid = false,
  isFormValid = false,
  isLoading = false,
  isOpen = false,
  noAccountsLabel = "Crea una cuenta en Más > Cuentas para registrar transacciones.",
  onAmountChange,
  onCurrencyChange,
  onDescriptionChange,
  onRequestClose,
  onSelectedAccountIdChange,
  onSelectedCategoryIdChange,
  onSelectedSubcategoryNameChange,
  onSignChange,
  onSubmit,
  quickAddAccountErrorLabel = "Selecciona una cuenta.",
  quickAddAccountLabel = "Cuenta",
  quickAddAmountErrorLabel = "Ingresa un monto mayor a 0.",
  quickAddAmountLabel = "Monto",
  quickAddAmountPlaceholder = "0.00",
  quickAddCategoryErrorLabel = "Selecciona una categoría.",
  quickAddCategoryLabel = "Categoría",
  quickAddCurrencyLabel = "Moneda",
  quickAddDescriptionErrorLabel = "Agrega una descripción corta.",
  quickAddDescriptionLabel = "Descripción",
  quickAddDescriptionPlaceholder = "Ej. Café, Uber, supermercado",
  quickAddExpenseLabel = "Egreso",
  quickAddIncomeLabel = "Ingreso",
  quickAddSubmitLabel = "Agregar transacción",
  quickAddTitle = "Quick Add",
  quickAddTypeLabel = "Tipo",
  selectedAccountId = "",
  selectedCategoryId = "",
  selectedCurrency = "ARS",
  selectedSubcategoryName = "",
  showValidation = false,
  sortedAccounts = [],
  sortedCategories = [],
  uncategorizedAccountLabel = "Sin cuenta",
  uncategorizedLabel = "Sin categoría",
}: TransactionEditorWidgetProps) {
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState<boolean>(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);
  const [isSubcategoryPickerOpen, setIsSubcategoryPickerOpen] = useState<boolean>(false);

  const selectedCategory = useMemo(
    () => sortedCategories.find((category) => category.id === selectedCategoryId) ?? null,
    [selectedCategoryId, sortedCategories],
  );

  const availableSubcategories = useMemo(
    () => normalizeSubcategories(selectedCategory?.subcategories),
    [selectedCategory?.subcategories],
  );

  const selectedAccountName = useMemo(
    () => sortedAccounts.find((account) => account.id === selectedAccountId)?.name ?? "",
    [selectedAccountId, sortedAccounts],
  );

  const categorySummaryLabel = useMemo(() => {
    if (!selectedCategory) {
      return "";
    }

    if (selectedSubcategoryName.trim().length === 0) {
      return selectedCategory.name;
    }

    return `${selectedCategory.name} · ${selectedSubcategoryName}`;
  }, [selectedCategory, selectedSubcategoryName]);

  const accountPickerItems = useMemo<OptionPickerItem[]>(
    () => sortedAccounts.map((account) => ({
      id: account.id,
      label: account.name,
      icon: "wallet",
      iconBg: "bg-[var(--text-primary)]",
    })),
    [sortedAccounts],
  );

  const categoryPickerItems = useMemo<OptionPickerItem[]>(
    () => sortedCategories.map((category) => ({
      id: category.id,
      label: category.name,
      icon: category.icon,
      iconBg: category.iconBg,
    })),
    [sortedCategories],
  );

  const subcategoryPickerItems = useMemo<OptionPickerItem[]>(() => {
    if (!selectedCategory) {
      return [];
    }

    const items: OptionPickerItem[] = [
      {
        id: NONE_SUBCATEGORY_ID,
        label: "Sin subcategoría",
        icon: selectedCategory.icon,
        iconBg: selectedCategory.iconBg,
      },
    ];

    availableSubcategories.forEach((subcategory) => {
      items.push({
        id: `subcategory:${subcategory}`,
        label: subcategory,
        icon: selectedCategory.icon,
        iconBg: selectedCategory.iconBg,
      });
    });

    return items;
  }, [availableSubcategories, selectedCategory]);

  const selectedSubcategoryId = selectedSubcategoryName.trim().length > 0
    ? `subcategory:${selectedSubcategoryName}`
    : NONE_SUBCATEGORY_ID;

  const canOpenAccountPicker = sortedAccounts.length > 0 && !isAccountsLoading;
  const canOpenCategoryPicker = sortedCategories.length > 0 && !isCategoriesLoading;
  const canOpenSubcategoryPicker = selectedCategory !== null && availableSubcategories.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setIsAccountPickerOpen(false);
      setIsCategoryPickerOpen(false);
      setIsSubcategoryPickerOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isSubcategoryPickerOpen) {
      return;
    }

    if (availableSubcategories.length === 0) {
      setIsSubcategoryPickerOpen(false);
    }
  }, [availableSubcategories.length, isSubcategoryPickerOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <SlideUpSheet
        isOpen={isOpen}
        title={editorMode === "create" ? quickAddTitle : editTitle}
        onRequestClose={onRequestClose}
        onSubmit={onSubmit}
        backdropAriaLabel="Cerrar formulario de transacción"
        handleAriaLabel="Desliza hacia arriba para cerrar"
        footer={(
          <ActionButton
            type="submit"
            icon={editorMode === "create" ? "plus" : "check"}
            label={editorMode === "create" ? quickAddSubmitLabel : editSubmitLabel}
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
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddTypeLabel}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSignChange?.("-")}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  editingAmountSign === "-"
                    ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                    : "bg-[var(--panel-bg)] text-[var(--text-secondary)]"
                }`}
              >
                {quickAddExpenseLabel}
              </button>
              <button
                type="button"
                onClick={() => onSignChange?.("+")}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  editingAmountSign === "+"
                    ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                    : "bg-[var(--panel-bg)] text-[var(--text-secondary)]"
                }`}
              >
                {quickAddIncomeLabel}
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddAmountLabel}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amountInput}
              onChange={(event) => onAmountChange?.(event.target.value)}
              placeholder={quickAddAmountPlaceholder}
              className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[#A1A1AA]"
            />
            {showValidation && !isAmountValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {quickAddAmountErrorLabel}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddCurrencyLabel}</span>
            <select
              value={selectedCurrency}
              onChange={(event) => onCurrencyChange?.(event.target.value as TransactionInputCurrency)}
              className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[#A1A1AA]"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddDescriptionLabel}</span>
            <input
              type="text"
              value={descriptionInput}
              onChange={(event) => onDescriptionChange?.(event.target.value)}
              placeholder={quickAddDescriptionPlaceholder}
              className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[#A1A1AA]"
            />
            {showValidation && !isDescriptionValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {quickAddDescriptionErrorLabel}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddAccountLabel}</span>
            <button
              type="button"
              onClick={() => {
                if (canOpenAccountPicker) {
                  setIsAccountPickerOpen(true);
                }
              }}
              disabled={!canOpenAccountPicker}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-left text-sm font-medium ${
                canOpenAccountPicker ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <span className="truncate">
                {selectedAccountName || uncategorizedAccountLabel}
              </span>
              <PhosphorIcon name="caret-right" size="text-[16px]" className="text-[var(--text-secondary)]" />
            </button>

            {showValidation && !isAccountValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {quickAddAccountErrorLabel}
              </span>
            )}
            {isAccountsLoading && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Cargando cuentas...</span>
            )}
            {accountsError && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">No pudimos cargar las cuentas.</span>
            )}
            {!isAccountsLoading && sortedAccounts.length === 0 && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{noAccountsLabel}</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddCategoryLabel}</span>
            <button
              type="button"
              onClick={() => {
                if (canOpenCategoryPicker) {
                  setIsCategoryPickerOpen(true);
                }
              }}
              disabled={!canOpenCategoryPicker}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-left text-sm font-medium ${
                canOpenCategoryPicker ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <span className="truncate">
                {categorySummaryLabel || uncategorizedLabel}
              </span>
              <PhosphorIcon name="caret-right" size="text-[16px]" className="text-[var(--text-secondary)]" />
            </button>

            {showValidation && !isCategoryValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {quickAddCategoryErrorLabel}
              </span>
            )}
            {isCategoriesLoading && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                Cargando categorías...
              </span>
            )}
            {categoriesError && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                No pudimos cargar las categorías.
              </span>
            )}
            {!isCategoriesLoading && sortedCategories.length === 0 && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                No hay categorías disponibles.
              </span>
            )}
          </label>

          {canOpenSubcategoryPicker && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Subcategoría</span>
              <button
                type="button"
                onClick={() => {
                  if (canOpenSubcategoryPicker) {
                    setIsSubcategoryPickerOpen(true);
                  }
                }}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)]"
              >
                <span className="truncate">{selectedSubcategoryName || "Sin subcategoría"}</span>
                <PhosphorIcon name="caret-right" size="text-[16px]" className="text-[var(--text-secondary)]" />
              </button>
            </label>
          )}
        </div>
      </SlideUpSheet>

      <OptionPickerSheet
        isOpen={isAccountPickerOpen}
        title="Seleccionar cuenta"
        items={accountPickerItems}
        selectedId={selectedAccountId || null}
        isLoading={isAccountsLoading}
        errorMessage={accountsError}
        emptyLabel={noAccountsLabel}
        onRequestClose={() => {
          setIsAccountPickerOpen(false);
        }}
        onSelect={(item) => {
          onSelectedAccountIdChange?.(item.id);
          setIsAccountPickerOpen(false);
        }}
      />

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
          const nextCategory = sortedCategories.find((category) => category.id === item.id);
          if (!nextCategory) {
            return;
          }

          onSelectedCategoryIdChange?.(nextCategory.id);
          onSelectedSubcategoryNameChange?.("");
          setIsCategoryPickerOpen(false);

          const nextSubcategories = normalizeSubcategories(nextCategory.subcategories);
          if (nextSubcategories.length > 0) {
            setIsSubcategoryPickerOpen(true);
          }
        }}
      />

      <OptionPickerSheet
        isOpen={isSubcategoryPickerOpen}
        title="Seleccionar subcategoría"
        items={subcategoryPickerItems}
        selectedId={selectedSubcategoryId}
        emptyLabel="Sin subcategorías"
        onRequestClose={() => {
          setIsSubcategoryPickerOpen(false);
        }}
        onSelect={(item) => {
          if (item.id === NONE_SUBCATEGORY_ID) {
            onSelectedSubcategoryNameChange?.("");
          } else {
            onSelectedSubcategoryNameChange?.(item.label);
          }

          setIsSubcategoryPickerOpen(false);
        }}
      />
    </>
  );
}
