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
}

export interface CategoriesRepository {
  list: () => Promise<CategoryItem[]>;
  getById: (id: string) => Promise<CategoryItem | null>;
  create: (input: CreateCategoryInput) => Promise<CategoryItem>;
  update: (id: string, patch: UpdateCategoryPatch) => Promise<CategoryItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
