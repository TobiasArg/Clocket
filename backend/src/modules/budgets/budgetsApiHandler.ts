import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { parseIdParam } from "../core-finance/coreFinanceRequest";
import { createBudgetsRepository } from "./budgetsRepository";
import { createBudgetsService, type BudgetsService } from "./budgetsService";
import type { BudgetListResponse, BudgetResponse, ClearBudgetsResponse, DeleteBudgetResponse } from "./budgetsContracts";

type BudgetsApiResponse = BudgetListResponse | BudgetResponse | DeleteBudgetResponse | ClearBudgetsResponse | CoreFinanceApiErrorResponse;

const createDefaultService = (): BudgetsService => createBudgetsService({ repository: createBudgetsRepository(getPrismaClient()) });

export const createBudgetsCollectionHandler = (dependencies: { service?: BudgetsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<BudgetsApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.listBudgets(req.query));
      if (req.method === "POST") return sendJson(res, 201, await service.createBudget(req.body));
      if (req.method === "DELETE") return sendJson(res, 200, await service.clearBudgets());
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createBudgetItemHandler = (dependencies: { service?: BudgetsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<BudgetsApiResponse>): Promise<void> {
    const parsedId = parseIdParam(req.query);
    if (!parsedId.ok) return sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.getBudget(parsedId.value));
      if (req.method === "PATCH") return sendJson(res, 200, await service.updateBudget(parsedId.value, req.body));
      if (req.method === "DELETE") return sendJson(res, 200, await service.deleteBudget(parsedId.value));
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "PATCH", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};
