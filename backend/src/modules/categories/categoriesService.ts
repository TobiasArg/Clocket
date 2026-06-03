import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { parseJsonObjectBody, readOptionalString, readRequiredString } from "../core-finance/coreFinanceRequest";
import {
  toCategoryResponse,
  type CategoryListResponse,
  type CategoryResponse,
  type DeleteCategoryResponse,
} from "./categoriesContracts";
import type { CategoriesRepository, CreateCategoryInput, SubcategoryInput, UpdateCategoryInput } from "./categoriesRepository";

const DEFAULT_ICON = "tag";
const DEFAULT_ICON_BG = "bg-[#71717A]";

export interface CategoriesService {
  listCategories: () => Promise<CategoryListResponse>;
  getCategory: (id: string) => Promise<CategoryResponse>;
  createCategory: (body: unknown) => Promise<CategoryResponse>;
  updateCategory: (id: string, body: unknown) => Promise<CategoryResponse>;
  replaceSubcategories: (id: string, body: unknown) => Promise<CategoryResponse>;
  deleteCategory: (id: string) => Promise<DeleteCategoryResponse>;
}

const parseSubcategories = (value: unknown): Array<string | SubcategoryInput> => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new CoreFinanceApiError("Field 'subcategories' must be an array.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  return value.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null && typeof (item as { name?: unknown }).name === "string") {
      return { name: (item as { name: string }).name };
    }
    throw new CoreFinanceApiError("Each subcategory must be a string or an object with a name.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  });
};

export const createCategoriesService = ({
  repository,
}: {
  repository: CategoriesRepository;
}): CategoriesService => {
  const requireFound = <T>(record: T | null, type: string, id: string): T => {
    if (!record) {
      throw new CoreFinanceApiError(`${type} '${id}' was not found.`, {
        code: "NOT_FOUND",
        status: 404,
      });
    }
    return record;
  };

  const parseCreate = (body: unknown): CreateCategoryInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const name = readRequiredString(parsedBody.value, "name");
    if (!name.ok) throw new CoreFinanceApiError(name.response.error, name.response);

    return {
      name: name.value,
      icon: readOptionalString(parsedBody.value, "icon") ?? DEFAULT_ICON,
      iconBg: readOptionalString(parsedBody.value, "iconBg") ?? DEFAULT_ICON_BG,
      subcategories: parseSubcategories(parsedBody.value.subcategories),
    };
  };

  const parseUpdate = (body: unknown): UpdateCategoryInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const patch: UpdateCategoryInput = {};

    if ("name" in parsedBody.value) {
      const name = readRequiredString(parsedBody.value, "name");
      if (!name.ok) throw new CoreFinanceApiError(name.response.error, name.response);
      patch.name = name.value;
    }
    if ("icon" in parsedBody.value) {
      const icon = readRequiredString(parsedBody.value, "icon");
      if (!icon.ok) throw new CoreFinanceApiError(icon.response.error, icon.response);
      patch.icon = icon.value;
    }
    if ("iconBg" in parsedBody.value) {
      const iconBg = readRequiredString(parsedBody.value, "iconBg");
      if (!iconBg.ok) throw new CoreFinanceApiError(iconBg.response.error, iconBg.response);
      patch.iconBg = iconBg.value;
    }

    return patch;
  };

  const parseReplaceSubcategories = (body: unknown): Array<string | SubcategoryInput> => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    return parseSubcategories(parsedBody.value.subcategories);
  };

  return {
    async listCategories() {
      const categories = await repository.listActive();
      return { categories: categories.map(toCategoryResponse) };
    },
    async getCategory(id) {
      return toCategoryResponse(requireFound(await repository.getById(id), "Category", id));
    },
    async createCategory(body) {
      return toCategoryResponse(await repository.create(parseCreate(body)));
    },
    async updateCategory(id, body) {
      return toCategoryResponse(requireFound(await repository.update(id, parseUpdate(body)), "Category", id));
    },
    async replaceSubcategories(id, body) {
      return toCategoryResponse(requireFound(
        await repository.replaceSubcategories(id, parseReplaceSubcategories(body)),
        "Category",
        id,
      ));
    },
    async deleteCategory(id) {
      if (!await repository.softDelete(id)) {
        throw new CoreFinanceApiError(`Category '${id}' was not found.`, {
          code: "NOT_FOUND",
          status: 404,
        });
      }
      return { deleted: true };
    },
  };
};
