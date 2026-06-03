import type {
  CategoriesRepository,
  CategoryItem,
  CreateCategoryInput,
  UpdateCategoryPatch,
} from "@/domain/categories/repository";
import { ensureCoreBackendCleanStartCutover } from "./coreFinanceCleanStart";
import { coreFinanceHttpClient, isNotFoundError, withCoreFinanceErrors } from "./coreFinanceHttpClient";

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

interface CategoryListResponse {
  categories: CategoryResponse[];
}

interface DeleteResponse {
  deleted: true;
}

export const toCategoryItem = (category: CategoryResponse): CategoryItem => ({
  id: category.id,
  name: category.name,
  icon: category.icon,
  iconBg: category.iconBg,
  subcategoryCount: category.subcategoryCount,
  subcategories: category.subcategories.map((subcategory) => subcategory.name),
});

const hasMetadataPatch = (patch: UpdateCategoryPatch): boolean => (
  patch.name !== undefined || patch.icon !== undefined || patch.iconBg !== undefined
);

export class HttpCategoriesRepository implements CategoriesRepository {
  public constructor() {
    ensureCoreBackendCleanStartCutover();
  }

  public async list(): Promise<CategoryItem[]> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.get<CategoryListResponse>("/api/categories");
      return response.data.categories.map(toCategoryItem);
    });
  }

  public async getById(id: string): Promise<CategoryItem | null> {
    try {
      return await withCoreFinanceErrors(async () => {
        const response = await coreFinanceHttpClient.get<CategoryResponse>(`/api/categories/${id}`);
        return toCategoryItem(response.data);
      });
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async create(input: CreateCategoryInput): Promise<CategoryItem> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.post<CategoryResponse>("/api/categories", input);
      return toCategoryItem(response.data);
    });
  }

  public async update(id: string, patch: UpdateCategoryPatch): Promise<CategoryItem | null> {
    try {
      return await withCoreFinanceErrors(async () => {
        let latest: CategoryResponse | null = null;

        if (hasMetadataPatch(patch)) {
          const metadata = {
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
            ...(patch.iconBg !== undefined ? { iconBg: patch.iconBg } : {}),
          };
          latest = (await coreFinanceHttpClient.patch<CategoryResponse>(`/api/categories/${id}`, metadata)).data;
        }

        if (patch.subcategories !== undefined) {
          latest = (await coreFinanceHttpClient.put<CategoryResponse>(
            `/api/categories/${id}/subcategories`,
            { subcategories: patch.subcategories },
          )).data;
        }

        if (!latest) {
          latest = (await coreFinanceHttpClient.get<CategoryResponse>(`/api/categories/${id}`)).data;
        }

        return toCategoryItem(latest);
      });
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async remove(id: string): Promise<boolean> {
    try {
      return await withCoreFinanceErrors(async () => {
        const response = await coreFinanceHttpClient.delete<DeleteResponse>(`/api/categories/${id}`);
        return response.data.deleted === true;
      });
    } catch (error) {
      if (isNotFoundError(error)) return false;
      throw error;
    }
  }

  public async clearAll(): Promise<void> {
    const categories = await this.list();
    await Promise.all(categories.map((category) => this.remove(category.id)));
  }
}

export const httpCategoriesRepository: CategoriesRepository = new HttpCategoriesRepository();
