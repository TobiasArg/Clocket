import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { createAccountsRepository } from "../accounts/accountsRepository";
import { createCategoriesRepository } from "../categories/categoriesRepository";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { createGoalsRepository } from "../goals/goalsRepository";
import { createInstallmentPlansRepository } from "../installments/installmentPlansRepository";
import { createTransactionsRepository } from "../transactions/transactionsRepository";
import type { HomeAnalyticsResponse, StatisticsAnalyticsResponse } from "./analyticsContracts";
import { createAnalyticsService, type AnalyticsService } from "./analyticsService";

type AnalyticsApiResponse = HomeAnalyticsResponse | StatisticsAnalyticsResponse | CoreFinanceApiErrorResponse;

const createDefaultService = (): AnalyticsService => {
  const prisma = getPrismaClient();
  return createAnalyticsService({
    accountsRepository: createAccountsRepository(prisma),
    categoriesRepository: createCategoriesRepository(prisma),
    goalsRepository: createGoalsRepository(prisma),
    installmentPlansRepository: createInstallmentPlansRepository(prisma),
    transactionsRepository: createTransactionsRepository(prisma),
  });
};

export const createAnalyticsHomeHandler = (dependencies: { service?: AnalyticsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<AnalyticsApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.getHomeAnalytics(req.query));
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createAnalyticsStatisticsHandler = (dependencies: { service?: AnalyticsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<AnalyticsApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.getStatisticsAnalytics(req.query));
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};
