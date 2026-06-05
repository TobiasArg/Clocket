import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { createAppSettingsRepository } from "./settingsRepository";
import { createAppSettingsService, type AppSettingsService } from "./settingsService";
import type { AppSettingsResponse } from "./settingsContracts";

type SettingsApiResponse = AppSettingsResponse | CoreFinanceApiErrorResponse;
const createDefaultService = (): AppSettingsService => createAppSettingsService({ repository: createAppSettingsRepository(getPrismaClient()) });

export const createAppSettingsHandler = (dependencies: { service?: AppSettingsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<SettingsApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.getSettings());
      if (req.method === "PATCH") return sendJson(res, 200, await service.updateSettings(req.body));
      if (req.method === "DELETE" || req.method === "POST") return sendJson(res, 200, await service.resetSettings());
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "PATCH", "DELETE", "POST"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};
