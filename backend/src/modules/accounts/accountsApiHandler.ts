import type { NextApiRequest, NextApiResponse } from "next";
import { requireMethod, sendError, sendJson } from "../../api/http";
import { getPrismaClient } from "../../persistence/prismaClient";
import { mapCoreFinanceError, type CoreFinanceApiErrorResponse } from "../core-finance/coreFinanceApiErrors";
import { parseIdParam } from "../core-finance/coreFinanceRequest";
import { createAccountsRepository } from "./accountsRepository";
import { createAccountsService, type AccountsService } from "./accountsService";
import type { AccountListResponse, AccountResponse, DeleteAccountResponse } from "./accountsContracts";

type AccountsApiResponse = AccountListResponse | AccountResponse | DeleteAccountResponse | CoreFinanceApiErrorResponse;

const createDefaultService = (): AccountsService => createAccountsService({
  repository: createAccountsRepository(getPrismaClient()),
});

export const createAccountsCollectionHandler = (
  dependencies: { service?: AccountsService } = {},
) => {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AccountsApiResponse>,
  ): Promise<void> {
    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") {
        sendJson(res, 200, await service.listAccounts());
        return;
      }
      if (req.method === "POST") {
        sendJson(res, 201, await service.createAccount(req.body));
        return;
      }
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "POST"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};

export const createAccountItemHandler = (
  dependencies: { service?: AccountsService } = {},
) => {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AccountsApiResponse>,
  ): Promise<void> {
    const parsedId = parseIdParam(req.query);
    if (!parsedId.ok) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, parsedId.response);
      return;
    }

    const service = dependencies.service ?? createDefaultService();
    try {
      if (req.method === "GET") {
        sendJson(res, 200, await service.getAccount(parsedId.value));
        return;
      }
      if (req.method === "PATCH") {
        sendJson(res, 200, await service.updateAccount(parsedId.value, req.body));
        return;
      }
      if (req.method === "DELETE") {
        sendJson(res, 200, await service.deleteAccount(parsedId.value));
        return;
      }
      requireMethod(req, res as NextApiResponse<CoreFinanceApiErrorResponse>, ["GET", "PATCH", "DELETE"], "INVALID_REQUEST");
    } catch (error) {
      sendError(res as NextApiResponse<CoreFinanceApiErrorResponse>, mapCoreFinanceError(error));
    }
  };
};
