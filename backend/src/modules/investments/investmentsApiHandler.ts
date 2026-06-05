import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { parseIdParam } from "../core-finance/coreFinanceRequest";
import type { AddInvestmentEntryResponse, ClearInvestmentsResponse, DeleteInvestmentResponse, InvestmentAssetRefsResponse, InvestmentEntryListResponse, InvestmentPositionListResponse, InvestmentPositionResponse, InvestmentRefsMapResponse, MarketQuoteSnapshotListResponse, MarketQuoteSnapshotResponse } from "./investmentsContracts";
import { createInvestmentsRepository } from "./investmentsRepository";
import { createInvestmentsService, type InvestmentsService } from "./investmentsService";

type InvestmentsApiResponse = InvestmentPositionListResponse | InvestmentPositionResponse | InvestmentEntryListResponse | AddInvestmentEntryResponse | MarketQuoteSnapshotResponse | MarketQuoteSnapshotListResponse | InvestmentAssetRefsResponse | InvestmentRefsMapResponse | DeleteInvestmentResponse | ClearInvestmentsResponse | null | CoreFinanceApiErrorResponse;

const createDefaultService = (): InvestmentsService => createInvestmentsService({ repository: createInvestmentsRepository(getPrismaClient()) });

export const createInvestmentPositionsCollectionHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "GET") return sendJson(res, 200, await service.listPositions());
    if (req.method === "POST") return sendJson(res, 201, await service.addPosition(req.body));
    if (req.method === "DELETE") return sendJson(res, 200, await service.clearAll());
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST", "DELETE"], "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentPositionItemHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const parsedId = parseIdParam(req.query);
  if (!parsedId.ok) return sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "GET") return sendJson(res, 200, await service.getPosition(parsedId.value));
    if (req.method === "PATCH") return sendJson(res, 200, await service.editPosition(parsedId.value, req.body));
    if (req.method === "DELETE") return sendJson(res, 200, await service.deletePosition(parsedId.value));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "PATCH", "DELETE"], "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentPositionEntriesHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const parsedId = parseIdParam(req.query);
  if (!parsedId.ok) return sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "GET") return sendJson(res, 200, await service.listEntriesByPosition(parsedId.value));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, "GET", "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentEntriesCollectionHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "GET") return sendJson(res, 200, await service.listEntriesByAsset(req.query));
    if (req.method === "POST") return sendJson(res, 201, await service.addEntry(req.body));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST"], "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentEntryItemHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const parsedId = parseIdParam(req.query);
  if (!parsedId.ok) return sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "DELETE") return sendJson(res, 200, await service.deleteEntry(parsedId.value));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, "DELETE", "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentSnapshotsCollectionHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "GET") return sendJson(res, 200, await service.listSnapshotsByAsset(req.query));
    if (req.method === "POST") return sendJson(res, 201, await service.addSnapshot(req.body));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST"], "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentLatestSnapshotHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "GET") return sendJson(res, 200, await service.getLatestSnapshotByAsset(req.query));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, "GET", "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentRefsHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "GET") return sendJson(res, 200, await service.getRefs(req.query));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, "GET", "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentDailyRefsHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "PATCH") return sendJson(res, 200, await service.updateDailyRef(req.body));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, "PATCH", "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};

export const createInvestmentMonthlyRefsHandler = (dependencies: { service?: InvestmentsService } = {}) => async (req: NextApiRequest, res: NextApiResponse<InvestmentsApiResponse>) => {
  const service = dependencies.service ?? createDefaultService();
  try {
    if (req.method === "PATCH") return sendJson(res, 200, await service.updateMonthRef(req.body));
    requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, "PATCH", "INVALID_REQUEST");
  } catch (error) { sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error)); }
};
