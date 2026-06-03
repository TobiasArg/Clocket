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
