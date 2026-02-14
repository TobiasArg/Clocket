import { useMemo, useState } from "react";
import type { Category } from "@/types";
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
  categoryNameInput: string;
  deleteConfirmCategoryId: string | null;
  expandedIndex: number | null;
  handleCreateCategory: () => Promise<void>;
  handleDeleteCategory: (category: Category) => Promise<void>;
  handleHeaderAction: () => void;
  handleToggle: (index: number) => void;
  isCategoryNameValid: boolean;
  isLoading: boolean;
  isQuickAddOpen: boolean;
  isTransactionsLoading: boolean;
  isUsingExternalCategories: boolean;
  resolvedCategories: Category[];
  setCategoryNameInput: (value: string) => void;
  setDeleteConfirmCategoryId: (value: string | null) => void;
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
    checkingUsageLabel = "Checking transactions...",
    errorLabel = "No pudimos cargar las categorías. Intenta nuevamente.",
    inUseDeleteMessage = "This category is in use and can’t be deleted yet.",
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

  return {
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
    isTransactionsLoading,
    isUsingExternalCategories,
    resolvedCategories,
    setCategoryNameInput,
    setDeleteConfirmCategoryId,
    showValidation,
    statusMessage,
    transactionsError: error,
    usageCountByCategoryId,
  };
};
