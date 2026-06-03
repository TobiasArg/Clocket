import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { parseIdParam } from "../core-finance/coreFinanceRequest";
import { createTransactionsRepository } from "./transactionsRepository";
import { createTransactionsService, type TransactionsService } from "./transactionsService";
import type { DeleteTransactionResponse, TransactionListResponse, TransactionResponse } from "./transactionsContracts";

type TransactionsApiResponse = TransactionListResponse | TransactionResponse | DeleteTransactionResponse | CoreFinanceApiErrorResponse;

const createDefaultService = (): TransactionsService => createTransactionsService({
  repository: createTransactionsRepository(getPrismaClient()),
});

export const createTransactionsCollectionHandler = (dependencies: { service?: TransactionsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<TransactionsApiResponse>): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") {
        sendJson(res, 200, await service.listTransactions(req.query));
        return;
      }
      if (req.method === "POST") {
        sendJson(res, 201, await service.createTransaction(req.body));
        return;
      }
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createTransactionItemHandler = (dependencies: { service?: TransactionsService } = {}) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse<TransactionsApiResponse>): Promise<void> {
    const parsedId = parseIdParam(req.query);
    if (!parsedId.ok) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
      return;
    }
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") {
        sendJson(res, 200, await service.getTransaction(parsedId.value));
        return;
      }
      if (req.method === "PATCH") {
        sendJson(res, 200, await service.updateTransaction(parsedId.value, req.body));
        return;
      }
      if (req.method === "DELETE") {
        sendJson(res, 200, await service.deleteTransaction(parsedId.value));
        return;
      }
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "PATCH", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};
