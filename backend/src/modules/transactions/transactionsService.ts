import { readSingleQueryParam } from "../../api/http";
import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import {
  isValidCurrency,
  parseJsonObjectBody,
  readDateOnlyInput,
  readDecimalInput,
  readOptionalNullableString,
  readRequiredString,
} from "../core-finance/coreFinanceRequest";
import {
  toTransactionResponse,
  type DeleteTransactionResponse,
  type TransactionListResponse,
  type TransactionResponse,
} from "./transactionsContracts";
import type {
  CreateTransactionInput,
  TransactionListFilters,
  TransactionRecordType,
  TransactionsRepository,
  UpdateTransactionInput,
} from "./transactionsRepository";

export interface TransactionsService {
  listTransactions: (query?: Record<string, string | string[] | undefined>) => Promise<TransactionListResponse>;
  getTransaction: (id: string) => Promise<TransactionResponse>;
  createTransaction: (body: unknown) => Promise<TransactionResponse>;
  updateTransaction: (id: string, body: unknown) => Promise<TransactionResponse>;
  deleteTransaction: (id: string) => Promise<DeleteTransactionResponse>;
}

const isTransactionType = (value: unknown): value is TransactionRecordType => {
  return value === "regular" || value === "saving";
};

const readOptionalInteger = (body: Record<string, unknown>, key: string): number | null | undefined => {
  if (!(key in body)) return undefined;
  if (body[key] === null) return null;
  if (typeof body[key] === "number" && Number.isInteger(body[key])) return body[key];
  throw new CoreFinanceApiError(`Field '${key}' must be an integer or null.`, {
    code: "INVALID_REQUEST",
    status: 400,
  });
};

const readOptionalText = (body: Record<string, unknown>, key: string): string | null | undefined => {
  return readOptionalNullableString(body, key);
};

export const createTransactionsService = ({
  repository,
}: {
  repository: TransactionsRepository;
}): TransactionsService => {
  const requireFound = <T>(record: T | null, id: string): T => {
    if (!record) {
      throw new CoreFinanceApiError(`Transaction '${id}' was not found.`, {
        code: "NOT_FOUND",
        status: 404,
      });
    }
    return record;
  };

  const parseFilters = (query: Record<string, string | string[] | undefined> = {}): TransactionListFilters => {
    const filters: TransactionListFilters = {};
    const keys = ["accountId", "categoryId", "subcategoryId", "goalId", "installmentPlanId"] as const;
    for (const key of keys) {
      const value = readSingleQueryParam(query[key]).trim();
      if (value) filters[key] = value;
    }

    for (const key of ["dateFrom", "dateTo"] as const) {
      const value = readSingleQueryParam(query[key]).trim();
      if (value) {
        const parsed = readDateOnlyInput({ [key]: value }, key, true);
        if (!parsed.ok) throw new CoreFinanceApiError(parsed.response.error, parsed.response);
        filters[key] = parsed.value;
      }
    }

    return filters;
  };

  const parseCreate = (body: unknown): CreateTransactionInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const accountId = readRequiredString(parsedBody.value, "accountId");
    if (!accountId.ok) throw new CoreFinanceApiError(accountId.response.error, accountId.response);
    const name = readRequiredString(parsedBody.value, "name");
    if (!name.ok) throw new CoreFinanceApiError(name.response.error, name.response);
    const amount = readDecimalInput(parsedBody.value, "amount", true);
    if (!amount.ok) throw new CoreFinanceApiError(amount.response.error, amount.response);
    const date = readDateOnlyInput(parsedBody.value, "date", true);
    if (!date.ok) throw new CoreFinanceApiError(date.response.error, date.response);
    if (amount.value === undefined || date.value === undefined) {
      throw new CoreFinanceApiError("Transaction amount and date are required.", {
        code: "INVALID_REQUEST",
        status: 400,
      });
    }

    const transactionType = parsedBody.value.transactionType ?? "regular";
    if (!isTransactionType(transactionType)) {
      throw new CoreFinanceApiError("Field 'transactionType' must be 'regular' or 'saving'.", {
        code: "INVALID_REQUEST",
        status: 400,
      });
    }
    if (parsedBody.value.currency !== undefined && !isValidCurrency(parsedBody.value.currency)) {
      throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", {
        code: "INVALID_REQUEST",
        status: 400,
      });
    }

    return {
      accountId: accountId.value,
      categoryId: readOptionalNullableString(parsedBody.value, "categoryId") ?? null,
      subcategoryId: readOptionalNullableString(parsedBody.value, "subcategoryId") ?? null,
      goalId: readOptionalNullableString(parsedBody.value, "goalId") ?? null,
      installmentPlanId: readOptionalNullableString(parsedBody.value, "installmentPlanId") ?? null,
      transactionType,
      name: name.value,
      amount: amount.value,
      ...(parsedBody.value.currency !== undefined ? { currency: parsedBody.value.currency } : {}),
      date: date.value,
      notes: readOptionalText(parsedBody.value, "notes") ?? null,
      uiIcon: readOptionalText(parsedBody.value, "uiIcon") ?? null,
      uiIconBg: readOptionalText(parsedBody.value, "uiIconBg") ?? null,
      cuotaInstallmentIndex: readOptionalInteger(parsedBody.value, "cuotaInstallmentIndex") ?? null,
      cuotaInstallmentsCount: readOptionalInteger(parsedBody.value, "cuotaInstallmentsCount") ?? null,
    };
  };

  const parseUpdate = (body: unknown): UpdateTransactionInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const patch: UpdateTransactionInput = {};

    if ("accountId" in parsedBody.value) {
      const accountId = readRequiredString(parsedBody.value, "accountId");
      if (!accountId.ok) throw new CoreFinanceApiError(accountId.response.error, accountId.response);
      patch.accountId = accountId.value;
    }
    for (const key of ["categoryId", "subcategoryId", "goalId", "installmentPlanId"] as const) {
      const value = readOptionalNullableString(parsedBody.value, key);
      if (value !== undefined) patch[key] = value;
    }
    if ("transactionType" in parsedBody.value) {
      if (!isTransactionType(parsedBody.value.transactionType)) {
        throw new CoreFinanceApiError("Field 'transactionType' must be 'regular' or 'saving'.", {
          code: "INVALID_REQUEST",
          status: 400,
        });
      }
      patch.transactionType = parsedBody.value.transactionType;
    }
    if ("name" in parsedBody.value) {
      const name = readRequiredString(parsedBody.value, "name");
      if (!name.ok) throw new CoreFinanceApiError(name.response.error, name.response);
      patch.name = name.value;
    }
    if ("amount" in parsedBody.value) {
      const amount = readDecimalInput(parsedBody.value, "amount", true);
      if (!amount.ok) throw new CoreFinanceApiError(amount.response.error, amount.response);
      patch.amount = amount.value;
    }
    if ("currency" in parsedBody.value) {
      if (!isValidCurrency(parsedBody.value.currency)) {
        throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", {
          code: "INVALID_REQUEST",
          status: 400,
        });
      }
      patch.currency = parsedBody.value.currency;
    }
    if ("date" in parsedBody.value) {
      const date = readDateOnlyInput(parsedBody.value, "date", true);
      if (!date.ok) throw new CoreFinanceApiError(date.response.error, date.response);
      patch.date = date.value;
    }
    for (const key of ["notes", "uiIcon", "uiIconBg"] as const) {
      const value = readOptionalText(parsedBody.value, key);
      if (value !== undefined) patch[key] = value;
    }
    for (const key of ["cuotaInstallmentIndex", "cuotaInstallmentsCount"] as const) {
      const value = readOptionalInteger(parsedBody.value, key);
      if (value !== undefined) patch[key] = value;
    }

    return patch;
  };

  return {
    async listTransactions(query) {
      const transactions = await repository.listActive(parseFilters(query));
      return { transactions: transactions.map(toTransactionResponse) };
    },
    async getTransaction(id) {
      return toTransactionResponse(requireFound(await repository.getById(id), id));
    },
    async createTransaction(body) {
      return toTransactionResponse(await repository.create(parseCreate(body)));
    },
    async updateTransaction(id, body) {
      return toTransactionResponse(requireFound(await repository.update(id, parseUpdate(body)), id));
    },
    async deleteTransaction(id) {
      if (!await repository.softDelete(id)) {
        throw new CoreFinanceApiError(`Transaction '${id}' was not found.`, {
          code: "NOT_FOUND",
          status: 404,
        });
      }
      return { deleted: true };
    },
  };
};
