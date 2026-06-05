import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { parseIdParam } from "../core-finance/coreFinanceRequest";
import { createGoalsRepository } from "./goalsRepository";
import { createGoalsService, type GoalsService } from "./goalsService";
import type { ClearGoalsResponse, DeleteGoalResponse, GoalListResponse, GoalResponse } from "./goalsContracts";

type GoalsApiResponse = GoalListResponse | GoalResponse | DeleteGoalResponse | ClearGoalsResponse | CoreFinanceApiErrorResponse;
const createDefaultService = (): GoalsService => createGoalsService({ repository: createGoalsRepository(getPrismaClient()) });

export const createGoalsCollectionHandler = (dependencies: { service?: GoalsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<GoalsApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.listGoals());
      if (req.method === "POST") return sendJson(res, 201, await service.createGoal(req.body));
      if (req.method === "DELETE") return sendJson(res, 200, await service.clearGoals());
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createGoalItemHandler = (dependencies: { service?: GoalsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<GoalsApiResponse>): Promise<void> {
    const parsedId = parseIdParam(req.query);
    if (!parsedId.ok) return sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.getGoal(parsedId.value));
      if (req.method === "PATCH") return sendJson(res, 200, await service.updateGoal(parsedId.value, req.body));
      if (req.method === "DELETE") return sendJson(res, 200, await service.deleteGoal(parsedId.value));
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "PATCH", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};
