import type { CategoryRecord, SubcategoryRecord } from "./categoriesRepository";

export interface SubcategoryResponse {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  subcategoryCount: number;
  subcategories: SubcategoryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  categories: CategoryResponse[];
}

export type TransactionClassification = "income" | "expense" | "saving";

export interface CategoryClassificationEligibilityResponse {
  income: boolean;
  expense: boolean;
  saving: boolean;
}

export interface TransactionEditorSubcategoryOptionResponse {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
}

export interface TransactionEditorCategoryOptionResponse {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  eligibility: CategoryClassificationEligibilityResponse;
  subcategories: TransactionEditorSubcategoryOptionResponse[];
}

export interface TransactionEditorClassificationOptionResponse {
  classification: TransactionClassification;
  label: string;
  amountSign: "positive" | "negative";
  requiresGoal: boolean;
}

export interface TransactionEditorOptionsResponse {
  classifications: TransactionEditorClassificationOptionResponse[];
  categories: TransactionEditorCategoryOptionResponse[];
}

export interface SubcategoryUsageResponse {
  id: string;
  categoryId: string;
  name: string;
  transactionCount: number;
  budgetCount: number;
  goalCount: number;
  installmentPlanCount: number;
  totalReferenceCount: number;
}

export interface CategoryUsageResponse {
  categoryId: string;
  transactionCount: number;
  budgetCount: number;
  goalCount: number;
  installmentPlanCount: number;
  totalReferenceCount: number;
  subcategories: SubcategoryUsageResponse[];
}

export type CategoryConstraintCode =
  | "DUPLICATE_CATEGORY"
  | "DUPLICATE_SUBCATEGORY"
  | "CATEGORY_IN_USE"
  | "SUBCATEGORY_IN_USE";

export type CategoryConstraintTarget = "category" | "subcategory";

export interface CategoryConstraintResponse {
  code: CategoryConstraintCode;
  target: CategoryConstraintTarget;
  message: string;
  categoryId?: string;
  subcategoryId?: string;
  normalizedName?: string;
  usage?: CategoryUsageResponse | SubcategoryUsageResponse;
}

export interface DeleteCategoryResponse {
  deleted: true;
}

export const toSubcategoryResponse = (subcategory: SubcategoryRecord): SubcategoryResponse => ({
  id: subcategory.id,
  categoryId: subcategory.categoryId,
  name: subcategory.name,
  sortOrder: subcategory.sortOrder,
  createdAt: subcategory.createdAt,
  updatedAt: subcategory.updatedAt,
});

export const toCategoryResponse = (category: CategoryRecord): CategoryResponse => ({
  id: category.id,
  name: category.name,
  icon: category.icon,
  iconBg: category.iconBg,
  subcategoryCount: category.subcategories.length,
  subcategories: category.subcategories.map(toSubcategoryResponse),
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});
