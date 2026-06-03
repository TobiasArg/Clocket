import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { parseIdParam } from "../core-finance/coreFinanceRequest";
import { createCategoriesRepository } from "./categoriesRepository";
import { createCategoriesService, type CategoriesService } from "./categoriesService";
import type { CategoryListResponse, CategoryResponse, DeleteCategoryResponse } from "./categoriesContracts";

type CategoriesApiResponse = CategoryListResponse | CategoryResponse | DeleteCategoryResponse | CoreFinanceApiErrorResponse;

const createDefaultService = (): CategoriesService => createCategoriesService({
  repository: createCategoriesRepository(getPrismaClient()),
});

export const createCategoriesCollectionHandler = (dependencies: { service?: CategoriesService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<CategoriesApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") {
        sendJson(res, 200, await service.listCategories());
        return;
      }
      if (req.method === "POST") {
        sendJson(res, 201, await service.createCategory(req.body));
        return;
      }
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createCategoryItemHandler = (dependencies: { service?: CategoriesService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<CategoriesApiResponse>): Promise<void> {
    const parsedId = parseIdParam(req.query);
    if (!parsedId.ok) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
      return;
    }
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") {
        sendJson(res, 200, await service.getCategory(parsedId.value));
        return;
      }
      if (req.method === "PATCH") {
        sendJson(res, 200, await service.updateCategory(parsedId.value, req.body));
        return;
      }
      if (req.method === "DELETE") {
        sendJson(res, 200, await service.deleteCategory(parsedId.value));
        return;
      }
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "PATCH", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createCategorySubcategoriesHandler = (dependencies: { service?: CategoriesService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<CategoriesApiResponse>): Promise<void> {
    const parsedId = parseIdParam(req.query);
    if (!parsedId.ok) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
      return;
    }
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "PUT") {
        sendJson(res, 200, await service.replaceSubcategories(parsedId.value, req.body));
        return;
      }
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, "PUT", "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};
