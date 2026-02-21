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
  expandedIndex: number | null;
  handleCloseQuickAdd: () => void;
  handleCreateCategory: () => Promise<void>;
  handleDeleteCategory: (category: Category) => Promise<void>;
  handleHeaderAction: () => void;
  handleToggle: (index: number) => void;
  isCategoryNameValid: boolean;
  isColorValid: boolean;
  isFormValid: boolean;
  isIconValid: boolean;
  isLoading: boolean;
  isQuickAddOpen: boolean;
  isTransactionsLoading: boolean;
  isUsingExternalCategories: boolean;
  iconOptions: string[];
  resolvedCategories: Category[];
  selectedColorKey: string;
  selectedIcon: string;
  setCategoryNameInput: (value: string) => void;
  setDeleteConfirmCategoryId: (value: string | null) => void;
  setSelectedColorKey: (value: string) => void;
  setSelectedIcon: (value: string) => void;
  showValidation: boolean;
  statusMessage: string | null;
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
  const [selectedIcon, setSelectedIcon] = useState<string>(DEFAULT_CATEGORY_ICON);
  const [selectedColorKey, setSelectedColorKeyState] = useState<CategoryColorKey>(DEFAULT_CATEGORY_COLOR_KEY);
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
  const normalizedIcon = selectedIcon.trim();
  const selectedColorClass = getCategoryColorOption(selectedColorKey).iconBgClass;
  const isCategoryNameValid = normalizedCategoryName.length > 0;
  const isIconValid = normalizedIcon.length > 0;
  const isColorValid = selectedColorClass.trim().length > 0;
  const isFormValid = isCategoryNameValid && isIconValid && isColorValid;

  const closeQuickAdd = () => {
    setIsQuickAddOpen(false);
    setCategoryNameInput("");
    setSelectedIcon(DEFAULT_CATEGORY_ICON);
    setSelectedColorKeyState(DEFAULT_CATEGORY_COLOR_KEY);
    setShowValidation(false);
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

    setStatusMessage(null);
    setDeleteConfirmCategoryId(null);
  };

  return {
    categoryNameInput,
    colorOptions: CATEGORY_COLOR_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      swatchClass: option.iconBgClass,
    })),
    deleteConfirmCategoryId,
    expandedIndex,
    handleCloseQuickAdd: closeQuickAdd,
    handleCreateCategory,
    handleDeleteCategory,
    handleHeaderAction,
    handleToggle,
    isCategoryNameValid,
    isColorValid,
    isFormValid,
    isIconValid,
    isLoading,
    isQuickAddOpen,
    isTransactionsLoading,
    isUsingExternalCategories,
    iconOptions: CATEGORY_ICON_OPTIONS,
    resolvedCategories,
    selectedColorKey,
    selectedIcon,
    setCategoryNameInput,
    setDeleteConfirmCategoryId,
    setSelectedColorKey,
    setSelectedIcon,
    showValidation,
    statusMessage,
    transactionsError: error,
    usageCountByCategoryId,
  };
};
