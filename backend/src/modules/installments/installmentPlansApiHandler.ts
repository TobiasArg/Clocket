import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { parseIdParam } from "../core-finance/coreFinanceRequest";
import { createInstallmentLedgerEffectsService, type InstallmentLedgerEffectsService } from "./installmentLedgerEffectsService";
import { createInstallmentPlansRepository } from "./installmentPlansRepository";
import { createInstallmentPlansService, type InstallmentPlansService } from "./installmentPlansService";
import type { ClearInstallmentPlansResponse, DeleteInstallmentPlanResponse, InstallmentPlanListResponse, InstallmentPlanResponse, MarkInstallmentPaidResponse, ReconcileDueInstallmentsResponse } from "./installmentPlansContracts";

type InstallmentPlansApiResponse = InstallmentPlanListResponse | InstallmentPlanResponse | DeleteInstallmentPlanResponse | ClearInstallmentPlansResponse | MarkInstallmentPaidResponse | ReconcileDueInstallmentsResponse | CoreFinanceApiErrorResponse;
const createDefaultService = (): InstallmentPlansService => createInstallmentPlansService({ repository: createInstallmentPlansRepository(getPrismaClient()) });
const createDefaultLedgerEffectsService = (): InstallmentLedgerEffectsService => {
  const repository = createInstallmentPlansRepository(getPrismaClient());
  return createInstallmentLedgerEffectsService({ repository });
};

export const createInstallmentPlansCollectionHandler = (dependencies: { service?: InstallmentPlansService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<InstallmentPlansApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.listInstallmentPlans());
      if (req.method === "POST") return sendJson(res, 201, await service.createInstallmentPlan(req.body));
      if (req.method === "DELETE") return sendJson(res, 200, await service.clearInstallmentPlans());
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createInstallmentPlanItemHandler = (dependencies: { service?: InstallmentPlansService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<InstallmentPlansApiResponse>): Promise<void> {
    const parsedId = parseIdParam(req.query);
    if (!parsedId.ok) return sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") return sendJson(res, 200, await service.getInstallmentPlan(parsedId.value));
      if (req.method === "PATCH") return sendJson(res, 200, await service.updateInstallmentPlan(parsedId.value, req.body));
      if (req.method === "DELETE") return sendJson(res, 200, await service.deleteInstallmentPlan(parsedId.value));
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "PATCH", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createMarkInstallmentPaidHandler = (dependencies: { service?: InstallmentLedgerEffectsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<InstallmentPlansApiResponse>): Promise<void> {
    const parsedId = parseIdParam(req.query);
    if (!parsedId.ok) return sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
    const service = dependencies.service ?? createDefaultLedgerEffectsService();
    try {
      if (req.method === "POST") return sendJson(res, 200, await service.markInstallmentPaid(parsedId.value));
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["POST"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createReconcileDueInstallmentsHandler = (dependencies: { service?: InstallmentLedgerEffectsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<InstallmentPlansApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultLedgerEffectsService();
    try {
      if (req.method === "POST") return sendJson(res, 200, await service.reconcileDueInstallments());
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["POST"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};
