import { useMemo, useState } from "react";
import type { Category } from "@/types";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  getCategoryColorOption,
} from "@/utils";
import type { CategoryColorKey } from "@/utils";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";

export interface UseCategoriesPageModelOptions {
  categories?: Category[];
  checkingUsageLabel?: string;
  errorLabel?: string;
  inUseDeleteMessage?: string;
  onAddClick?: () => void;
  onCategoryClick?: (index: number) => void;
}

export interface UseCategoriesPageModelResult {
  colorOptions: Array<{ key: string; label: string; swatchClass: string }>;
  categoryNameInput: string;
  deleteConfirmCategoryId: string | null;
  handleCloseCategoryDetail: () => void;
  handleCloseQuickAdd: () => void;
  handleCreateCategory: () => Promise<void>;
  handleCreateSubcategory: () => Promise<void>;
  handleDeleteCategory: (category: Category) => Promise<void>;
  handleDeleteSubcategory: (subcategoryName: string) => Promise<void>;
  handleHeaderAction: () => void;
  handleOpenCategory: (index: number) => void;
  isCategoryDetailOpen: boolean;
  isCategoryNameValid: boolean;
  isColorValid: boolean;
  isFormValid: boolean;
  isIconValid: boolean;
  isLoading: boolean;
  isQuickAddOpen: boolean;
  isSubcategoryNameValid: boolean;
  isTransactionsLoading: boolean;
  isUsingExternalCategories: boolean;
  iconOptions: string[];
  resolvedCategories: Category[];
  selectedColorKey: string;
  selectedIcon: string;
  selectedCategory: Category | null;
  selectedCategoryUsageCount: number;
  setCategoryNameInput: (value: string) => void;
  setDeleteConfirmCategoryId: (value: string | null) => void;
  setSelectedColorKey: (value: string) => void;
  setSelectedIcon: (value: string) => void;
  setSubcategoryNameInput: (value: string) => void;
  showValidation: boolean;
  statusMessage: string | null;
  subcategoryNameInput: string;
  transactionsError: string | null;
  usageCountByCategoryId: Map<string, number>;
}

export const useCategoriesPageModel = (
  options: UseCategoriesPageModelOptions = {},
): UseCategoriesPageModelResult => {
  const {
    categories,
    checkingUsageLabel = "Verificando transacciones...",
    errorLabel = "No pudimos cargar las categorías. Intenta nuevamente.",
    inUseDeleteMessage = "Esta categoría está en uso y no puede eliminarse aún.",
    onAddClick,
    onCategoryClick,
  } = options;

  const {
    items: storedCategories,
    isLoading,
    error,
    create,
    update,
    remove,
  } = useCategories();
  const {
    items: transactions,
    isLoading: isTransactionsLoading,
  } = useTransactions();

  const isUsingExternalCategories = Array.isArray(categories);
  const resolvedCategories = categories ?? storedCategories;

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [categoryNameInput, setCategoryNameInput] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<string>(DEFAULT_CATEGORY_ICON);
  const [selectedColorKey, setSelectedColorKeyState] = useState<CategoryColorKey>(DEFAULT_CATEGORY_COLOR_KEY);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteConfirmCategoryId, setDeleteConfirmCategoryId] = useState<string | null>(null);
  const [subcategoryNameInput, setSubcategoryNameInput] = useState<string>("");

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
  const normalizedIcon = selectedIcon.trim();
  const selectedColorClass = getCategoryColorOption(selectedColorKey).iconBgClass;
  const isCategoryNameValid = normalizedCategoryName.length > 0;
  const isIconValid = normalizedIcon.length > 0;
  const isColorValid = selectedColorClass.trim().length > 0;
  const normalizedSubcategoryName = subcategoryNameInput.trim();
  const isSubcategoryNameValid = normalizedSubcategoryName.length > 0;
  const isFormValid = isCategoryNameValid && isIconValid && isColorValid;

  const selectedCategory = useMemo<Category | null>(() => {
    if (selectedCategoryIndex === null) {
      return null;
    }

    return resolvedCategories[selectedCategoryIndex] ?? null;
  }, [resolvedCategories, selectedCategoryIndex]);

  const selectedCategoryUsageCount = selectedCategory?.id
    ? (usageCountByCategoryId.get(selectedCategory.id) ?? 0)
    : 0;
  const isCategoryDetailOpen = selectedCategory !== null;

  const closeQuickAdd = () => {
    setIsQuickAddOpen(false);
    setCategoryNameInput("");
    setSelectedIcon(DEFAULT_CATEGORY_ICON);
    setSelectedColorKeyState(DEFAULT_CATEGORY_COLOR_KEY);
    setShowValidation(false);
  };

  const closeCategoryDetail = () => {
    setSelectedCategoryIndex(null);
    setDeleteConfirmCategoryId(null);
    setSubcategoryNameInput("");
  };

  const setSelectedColorKey = (value: string) => {
    const resolvedColorKey = CATEGORY_COLOR_OPTIONS.find((option) => option.key === value)?.key
      ?? DEFAULT_CATEGORY_COLOR_KEY;
    setSelectedColorKeyState(resolvedColorKey);
  };

  const handleHeaderAction = () => {
    if (isQuickAddOpen) {
      closeQuickAdd();
    } else {
      closeCategoryDetail();
      setIsQuickAddOpen(true);
      setShowValidation(false);
    }

    setStatusMessage(null);
    onAddClick?.();
  };

  const handleOpenCategory = (index: number) => {
    if (index < 0 || index >= resolvedCategories.length) {
      return;
    }

    if (isQuickAddOpen) {
      closeQuickAdd();
    }

    setSelectedCategoryIndex(index);
    setStatusMessage(null);
    setDeleteConfirmCategoryId(null);
    setSubcategoryNameInput("");
    onCategoryClick?.(index);
  };

  const handleCreateCategory = async () => {
    setShowValidation(true);
    if (!isFormValid || isUsingExternalCategories) {
      return;
    }

    const created = await create({
      name: normalizedCategoryName,
      icon: normalizedIcon,
      iconBg: selectedColorClass,
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

    closeCategoryDetail();
    setStatusMessage(null);
    setDeleteConfirmCategoryId(null);
  };

  const handleCreateSubcategory = async () => {
    if (!selectedCategory?.id || isUsingExternalCategories || !isSubcategoryNameValid) {
      return;
    }

    const existingSubcategories = Array.isArray(selectedCategory.subcategories)
      ? selectedCategory.subcategories
      : [];
    const isDuplicate = existingSubcategories.some((subcategory) => (
      subcategory.trim().toLocaleLowerCase("es-ES")
      === normalizedSubcategoryName.toLocaleLowerCase("es-ES")
    ));

    if (isDuplicate) {
      return;
    }

    const nextSubcategories = [...existingSubcategories, normalizedSubcategoryName];
    const updated = await update(selectedCategory.id, {
      subcategories: nextSubcategories,
      subcategoryCount: nextSubcategories.length,
    });

    if (!updated) {
      setStatusMessage(errorLabel);
      return;
    }

    setSubcategoryNameInput("");
    setStatusMessage(null);
  };

  const handleDeleteSubcategory = async (subcategoryName: string) => {
    if (!selectedCategory?.id || isUsingExternalCategories) {
      return;
    }

    const existingSubcategories = Array.isArray(selectedCategory.subcategories)
      ? selectedCategory.subcategories
      : [];
    const targetSubcategory = subcategoryName.trim().toLocaleLowerCase("es-ES");
    const nextSubcategories = existingSubcategories.filter((subcategory) => (
      subcategory.trim().toLocaleLowerCase("es-ES") !== targetSubcategory
    ));

    if (nextSubcategories.length === existingSubcategories.length) {
      return;
    }

    const updated = await update(selectedCategory.id, {
      subcategories: nextSubcategories,
      subcategoryCount: nextSubcategories.length,
    });

    if (!updated) {
      setStatusMessage(errorLabel);
      return;
    }

    setStatusMessage(null);
  };

  return {
    categoryNameInput,
    colorOptions: CATEGORY_COLOR_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      swatchClass: option.iconBgClass,
    })),
    deleteConfirmCategoryId,
    handleCloseCategoryDetail: closeCategoryDetail,
    handleCloseQuickAdd: closeQuickAdd,
    handleCreateCategory,
    handleCreateSubcategory,
    handleDeleteCategory,
    handleDeleteSubcategory,
    handleHeaderAction,
    handleOpenCategory,
    isCategoryDetailOpen,
    isCategoryNameValid,
    isColorValid,
    isFormValid,
    isIconValid,
    isLoading,
    isQuickAddOpen,
    isSubcategoryNameValid,
    isTransactionsLoading,
    isUsingExternalCategories,
    iconOptions: CATEGORY_ICON_OPTIONS,
    resolvedCategories,
    selectedColorKey,
    selectedIcon,
    selectedCategory,
    selectedCategoryUsageCount,
    setCategoryNameInput,
    setDeleteConfirmCategoryId,
    setSelectedColorKey,
    setSelectedIcon,
    setSubcategoryNameInput,
    showValidation,
    statusMessage,
    subcategoryNameInput,
    transactionsError: error,
    usageCountByCategoryId,
  };
};
