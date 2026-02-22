import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BudgetCategoryColorOption,
  BudgetCategoryOption,
  BudgetCreateCategoryInput,
} from "@/hooks";
import {
  BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  normalizeBudgetScopeRules,
  type BudgetScopeRule,
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

const normalizeSubcategories = (subcategories: string[] | undefined): string[] => {
  if (!Array.isArray(subcategories)) {
    return [];
  }

  const unique = new Set<string>();
  subcategories.forEach((subcategory) => {
    const normalized = subcategory.trim();
    if (normalized.length === 0) {
      return;
    }

    unique.add(normalized);
  });

  return Array.from(unique);
};

const buildSelectedSubcategorySet = (rule: BudgetScopeRule | null): Set<string> => {
  if (!rule || rule.mode !== "selected_subcategories") {
    return new Set<string>();
  }

  return new Set(
    (rule.subcategoryNames ?? [])
      .map((subcategory) => subcategory.trim())
      .filter((subcategory) => subcategory.length > 0),
  );
};

const getRuleSummaryLabel = (
  rule: BudgetScopeRule,
  noneLabel: string,
  allLabel: string,
): string => {
  if (rule.mode === "all_subcategories") {
    return allLabel;
  }

  const names = (rule.subcategoryNames ?? [])
    .map((subcategory) => subcategory === BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN ? noneLabel : subcategory)
    .filter((subcategory) => subcategory.trim().length > 0);

  if (names.length === 0) {
    return "Sin subcategorías seleccionadas";
  }

  return names.join(" · ");
};

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
  isFormValid: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isScopeValid: boolean;
  limitAmountInput: string;
  onAmountChange: (value: string) => void;
  onBudgetNameChange: (value: string) => void;
  onCreateCategory: (input: BudgetCreateCategoryInput) => Promise<BudgetCategoryOption | null>;
  onRequestClose?: () => void;
  onScopeRulesChange: (value: BudgetScopeRule[]) => void;
  onSubmit: () => void;
  scopeModeAllLabel?: string;
  scopeModeSelectedLabel?: string;
  scopeNoSubcategoryLabel?: string;
  selectedScopeRules: BudgetScopeRule[];
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
  isFormValid,
  isLoading,
  isOpen,
  isScopeValid,
  limitAmountInput,
  onAmountChange,
  onBudgetNameChange,
  onCreateCategory,
  onRequestClose,
  onScopeRulesChange,
  onSubmit,
  scopeModeAllLabel = "Todas",
  scopeModeSelectedLabel = "Seleccionadas",
  scopeNoSubcategoryLabel = "Sin subcategoría",
  selectedScopeRules,
  showValidation,
  submitLabel,
  title,
}: BudgetQuickAddWidgetProps) {
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);
  const [isSubcategoryPickerOpen, setIsSubcategoryPickerOpen] = useState<boolean>(false);
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState<string>("");
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState<boolean>(false);
  const [createCategoryNameInput, setCreateCategoryNameInput] = useState<string>("");
  const [createCategoryIcon, setCreateCategoryIcon] = useState<string>(DEFAULT_CATEGORY_ICON);
  const [createCategoryColorKey, setCreateCategoryColorKey] = useState<string>(DEFAULT_CATEGORY_COLOR_KEY);
  const [showCreateCategoryValidation, setShowCreateCategoryValidation] = useState<boolean>(false);
  const [isCreateCategorySubmitting, setIsCreateCategorySubmitting] = useState<boolean>(false);

  const normalizedScopeRules = useMemo(
    () => normalizeBudgetScopeRules(selectedScopeRules),
    [selectedScopeRules],
  );

  const categoriesById = useMemo(() => {
    const map = new Map<string, BudgetCategoryOption>();
    categories.forEach((category) => {
      map.set(category.id, {
        ...category,
        subcategories: normalizeSubcategories(category.subcategories),
      });
    });
    return map;
  }, [categories]);

  const selectedRulesByCategoryId = useMemo(() => {
    const map = new Map<string, BudgetScopeRule>();
    normalizedScopeRules.forEach((rule) => {
      map.set(rule.categoryId, rule);
    });
    return map;
  }, [normalizedScopeRules]);

  const selectedRuleRows = useMemo(() => {
    return normalizedScopeRules
      .map((rule) => ({
        rule,
        category: categoriesById.get(rule.categoryId) ?? null,
      }))
      .sort((left, right) => {
        const leftName = left.category?.name ?? left.rule.categoryId;
        const rightName = right.category?.name ?? right.rule.categoryId;
        return leftName.localeCompare(rightName);
      });
  }, [categoriesById, normalizedScopeRules]);

  const categoryPickerItems = useMemo<OptionPickerItem[]>(() => {
    const items = categories.map((category) => {
      const selectedRule = selectedRulesByCategoryId.get(category.id);
      return {
        id: category.id,
        label: category.name,
        icon: category.icon,
        iconBg: category.iconBg,
        subtitle: selectedRule
          ? getRuleSummaryLabel(selectedRule, scopeNoSubcategoryLabel, "Todas las subcategorías")
          : undefined,
        meta: selectedRule ? "Incluida" : undefined,
      } satisfies OptionPickerItem;
    });

    items.push({
      id: CREATE_CATEGORY_OPTION_ID,
      label: categoryCreateActionLabel,
      icon: "plus",
      iconBg: "bg-[var(--surface-border)]",
      subtitle: "Crear una categoría nueva",
    });

    return items;
  }, [categories, categoryCreateActionLabel, scopeNoSubcategoryLabel, selectedRulesByCategoryId]);

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
    setIsSubcategoryPickerOpen(false);
    setSubcategoryCategoryId("");
    setIsCreateCategoryOpen(false);
    resetCreateCategoryDraft();
  }, [isOpen, resetCreateCategoryDraft]);

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

  const openSubcategoryPicker = (categoryId: string) => {
    const category = categoriesById.get(categoryId);
    if (!category) {
      return;
    }

    setSubcategoryCategoryId(category.id);
    setIsSubcategoryPickerOpen(true);
  };

  const applyScopeRules = (nextRules: BudgetScopeRule[]) => {
    onScopeRulesChange(normalizeBudgetScopeRules(nextRules));
  };

  const handleAddCategoryScope = (categoryId: string) => {
    const alreadySelected = selectedRulesByCategoryId.has(categoryId);
    if (alreadySelected) {
      openSubcategoryPicker(categoryId);
      return;
    }

    const nextRules = normalizeBudgetScopeRules([
      ...normalizedScopeRules,
      {
        categoryId,
        mode: "all_subcategories",
      },
    ]);
    applyScopeRules(nextRules);

    const category = categoriesById.get(categoryId);
    if (category && category.subcategories.length > 0) {
      openSubcategoryPicker(categoryId);
    }
  };

  const handleRemoveCategoryScope = (categoryId: string) => {
    const nextRules = normalizedScopeRules.filter((rule) => rule.categoryId !== categoryId);
    applyScopeRules(nextRules);

    if (subcategoryCategoryId === categoryId) {
      setIsSubcategoryPickerOpen(false);
      setSubcategoryCategoryId("");
    }
  };

  const handleModeChange = (categoryId: string, mode: BudgetScopeRule["mode"]) => {
    const nextRules = normalizedScopeRules.map((rule) => {
      if (rule.categoryId !== categoryId) {
        return rule;
      }

      if (mode === "all_subcategories") {
        return {
          categoryId,
          mode: "all_subcategories",
        } satisfies BudgetScopeRule;
      }

      return {
        categoryId,
        mode: "selected_subcategories",
        subcategoryNames: (() => {
          const selected = Array.from(buildSelectedSubcategorySet(rule));
          return selected.length > 0
            ? selected
            : [BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN];
        })(),
      } satisfies BudgetScopeRule;
    });

    applyScopeRules(nextRules);
    if (mode === "selected_subcategories") {
      openSubcategoryPicker(categoryId);
    }
  };

  const activeSubcategoryCategory = categoriesById.get(subcategoryCategoryId) ?? null;
  const activeSubcategoryRule = selectedRulesByCategoryId.get(subcategoryCategoryId) ?? null;
  const activeSelectedSubcategories = buildSelectedSubcategorySet(activeSubcategoryRule);

  const availableSubcategoryTokens = useMemo(() => {
    if (!activeSubcategoryCategory) {
      return [] as string[];
    }

    return [
      BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN,
      ...normalizeSubcategories(activeSubcategoryCategory.subcategories),
    ];
  }, [activeSubcategoryCategory]);

  const toggleActiveSubcategory = (token: string) => {
    if (!activeSubcategoryCategory) {
      return;
    }

    const nextSelected = new Set(activeSelectedSubcategories);
    if (nextSelected.has(token)) {
      if (nextSelected.size === 1) {
        return;
      }
      nextSelected.delete(token);
    } else {
      nextSelected.add(token);
    }

    const nextRules = normalizedScopeRules.map((rule) => {
      if (rule.categoryId !== activeSubcategoryCategory.id) {
        return rule;
      }

      return {
        categoryId: rule.categoryId,
        mode: "selected_subcategories",
        subcategoryNames: Array.from(nextSelected),
      } satisfies BudgetScopeRule;
    });

    applyScopeRules(nextRules);
  };

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

        handleAddCategoryScope(created.id);
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

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{categoryLabel}</span>
            <button
              type="button"
              onClick={() => {
                if (!isCategoriesLoading) {
                  setIsCategoryPickerOpen(true);
                }
              }}
              disabled={isCategoriesLoading}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)]"
            >
              <span className="truncate">Agregar o editar categorías</span>
              <PhosphorIcon name="caret-right" size="text-[16px]" className="text-[var(--text-secondary)]" />
            </button>

            {selectedRuleRows.length > 0 && (
              <div className="flex flex-col gap-2">
                {selectedRuleRows.map(({ rule, category }) => {
                  const isMissingCategory = category === null;
                  const summaryLabel = getRuleSummaryLabel(
                    rule,
                    scopeNoSubcategoryLabel,
                    "Todas las subcategorías",
                  );

                  return (
                    <div
                      key={rule.categoryId}
                      className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <IconBadge
                            icon={category?.icon ?? "warning"}
                            bg={category?.iconBg ?? "bg-[#71717A]"}
                            size="h-[30px] w-[30px]"
                            rounded="rounded-lg"
                          />
                          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {category?.name ?? "Categoría eliminada"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryScope(rule.categoryId)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--panel-bg)] text-[var(--text-secondary)]"
                          aria-label="Quitar categoría del alcance"
                        >
                          <PhosphorIcon name="trash" size="text-[14px]" />
                        </button>
                      </div>

                      {isMissingCategory ? (
                        <span className="mt-2 block text-[11px] font-medium text-[var(--text-secondary)]">
                          Esta categoría ya no existe. Quita o reemplaza el alcance para guardar.
                        </span>
                      ) : (
                        <>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleModeChange(rule.categoryId, "all_subcategories")}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                rule.mode === "all_subcategories"
                                  ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                                  : "bg-[var(--panel-bg)] text-[var(--text-secondary)]"
                              }`}
                            >
                              {scopeModeAllLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModeChange(rule.categoryId, "selected_subcategories")}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                rule.mode === "selected_subcategories"
                                  ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                                  : "bg-[var(--panel-bg)] text-[var(--text-secondary)]"
                              }`}
                            >
                              {scopeModeSelectedLabel}
                            </button>
                          </div>

                          {rule.mode === "selected_subcategories" && (
                            <button
                              type="button"
                              onClick={() => openSubcategoryPicker(rule.categoryId)}
                              className="mt-2 flex w-full items-center justify-between rounded-xl bg-[var(--panel-bg)] px-3 py-2 text-left"
                            >
                              <span className="truncate text-xs font-medium text-[var(--text-secondary)]">
                                {summaryLabel}
                              </span>
                              <PhosphorIcon
                                name="caret-right"
                                size="text-[14px]"
                                className="text-[var(--text-secondary)]"
                              />
                            </button>
                          )}

                          {rule.mode === "all_subcategories" && (
                            <span className="mt-2 block text-[11px] font-medium text-[var(--text-secondary)]">
                              {summaryLabel}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {showValidation && !isScopeValid && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{categoryErrorLabel}</span>
            )}
            {showValidation && budgetFormValidationLabel && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{budgetFormValidationLabel}</span>
            )}
            {isCategoriesLoading && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Cargando categorías...</span>
            )}
            {categoriesError && (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">No pudimos cargar las categorías.</span>
            )}
          </div>

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
        title="Seleccionar categorías"
        items={categoryPickerItems}
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

          handleAddCategoryScope(item.id);
          setIsCategoryPickerOpen(false);
        }}
      />

      <SlideUpSheet
        isOpen={isSubcategoryPickerOpen}
        title={activeSubcategoryCategory ? `Subcategorías · ${activeSubcategoryCategory.name}` : "Subcategorías"}
        onRequestClose={() => {
          setIsSubcategoryPickerOpen(false);
          setSubcategoryCategoryId("");
        }}
        backdropAriaLabel="Cerrar selector de subcategorías"
        handleAriaLabel="Desliza hacia arriba para cerrar"
        footer={(
          <ActionButton
            type="button"
            icon="check"
            label="Listo"
            iconColor="text-[var(--text-primary)]"
            labelColor="text-[var(--text-primary)]"
            bg="bg-[var(--surface-border)]"
            padding="px-4 py-3"
            onClick={() => {
              setIsSubcategoryPickerOpen(false);
              setSubcategoryCategoryId("");
            }}
          />
        )}
      >
        <div className="flex flex-col">
          {activeSubcategoryCategory && availableSubcategoryTokens.map((token, index) => {
            const isSelected = activeSelectedSubcategories.has(token);
            const label = token === BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN
              ? scopeNoSubcategoryLabel
              : token;

            return (
              <button
                key={token}
                type="button"
                onClick={() => toggleActiveSubcategory(token)}
                className={`flex items-center justify-between gap-2 px-1 py-2 text-left ${
                  index < availableSubcategoryTokens.length - 1 ? "border-b border-[var(--surface-border)]" : ""
                }`}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <IconBadge
                    icon={activeSubcategoryCategory.icon}
                    bg={activeSubcategoryCategory.iconBg}
                    size="h-[34px] w-[34px]"
                    rounded="rounded-lg"
                  />
                  <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{label}</span>
                </div>
                {isSelected && (
                  <PhosphorIcon
                    name="check"
                    size="text-[16px]"
                    className="text-[var(--text-secondary)]"
                  />
                )}
              </button>
            );
          })}

          {activeSubcategoryCategory && activeSelectedSubcategories.size === 0 && (
            <span className="mt-2 block text-[11px] font-medium text-[var(--text-secondary)]">
              Selecciona al menos una subcategoría para mantener este alcance.
            </span>
          )}
        </div>
      </SlideUpSheet>

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
