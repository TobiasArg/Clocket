import type { Category } from "@/types";

export interface CategoryItem extends Category {
  id: string;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  iconBg?: string;
}

export interface UpdateCategoryPatch {
  name?: string;
  icon?: string;
  iconBg?: string;
  subcategoryCount?: number;
  subcategories?: string[];
}

export type TransactionClassification = "income" | "expense" | "saving";

export interface CategoryClassificationEligibility {
  income: boolean;
  expense: boolean;
  saving: boolean;
}

export interface TransactionEditorSubcategoryOption {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
}

export interface TransactionEditorCategoryOption {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  eligibility: CategoryClassificationEligibility;
  subcategories: TransactionEditorSubcategoryOption[];
}

export interface TransactionEditorClassificationOption {
  classification: TransactionClassification;
  label: string;
  amountSign: "positive" | "negative";
  requiresGoal: boolean;
}

export interface TransactionEditorOptions {
  classifications: TransactionEditorClassificationOption[];
  categories: TransactionEditorCategoryOption[];
}

export interface CategoriesRepository {
  list: () => Promise<CategoryItem[]>;
  listTransactionEditorOptions: () => Promise<TransactionEditorOptions>;
  getById: (id: string) => Promise<CategoryItem | null>;
  create: (input: CreateCategoryInput) => Promise<CategoryItem>;
  update: (id: string, patch: UpdateCategoryPatch) => Promise<CategoryItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
