import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import {
  isValidCurrency,
  parseJsonObjectBody,
  readDecimalInput,
  readOptionalString,
  readRequiredString,
} from "../core-finance/coreFinanceRequest";
import {
  toAccountResponse,
  type AccountListResponse,
  type AccountResponse,
  type DeleteAccountResponse,
} from "./accountsContracts";
import { AccountsRepositoryError, type AccountsRepository, type CreateAccountInput, type UpdateAccountInput } from "./accountsRepository";

export interface AccountsService {
  listAccounts: () => Promise<AccountListResponse>;
  getAccount: (id: string) => Promise<AccountResponse>;
  createAccount: (body: unknown) => Promise<AccountResponse>;
  updateAccount: (id: string, body: unknown) => Promise<AccountResponse>;
  deleteAccount: (id: string) => Promise<DeleteAccountResponse>;
}

export const createAccountsService = ({
  repository,
}: {
  repository: AccountsRepository;
}): AccountsService => {
  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AccountsRepositoryError) {
        throw new CoreFinanceApiError(error.message, { code: error.code, status: 409 });
      }
      throw error;
    }
  };

  const parseCreate = (body: unknown): CreateAccountInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);

    const name = readRequiredString(parsedBody.value, "name");
    if (!name.ok) throw new CoreFinanceApiError(name.response.error, name.response);
    const icon = readRequiredString(parsedBody.value, "icon");
    if (!icon.ok) throw new CoreFinanceApiError(icon.response.error, icon.response);
    const balance = readDecimalInput(parsedBody.value, "balance", false);
    if (!balance.ok) throw new CoreFinanceApiError(balance.response.error, balance.response);

    const currency = parsedBody.value.currency;
    if (currency !== undefined && !isValidCurrency(currency)) {
      throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", {
        code: "INVALID_REQUEST",
        status: 400,
      });
    }

    return {
      name: name.value,
      icon: icon.value,
      ...(balance.value !== undefined ? { balance: balance.value } : {}),
      ...(currency !== undefined ? { currency } : {}),
    };
  };

  const parseUpdate = (body: unknown): UpdateAccountInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const patch: UpdateAccountInput = {};

    if ("name" in parsedBody.value) {
      const name = readRequiredString(parsedBody.value, "name");
      if (!name.ok) throw new CoreFinanceApiError(name.response.error, name.response);
      patch.name = name.value;
    }
    if ("icon" in parsedBody.value) {
      const icon = readRequiredString(parsedBody.value, "icon");
      if (!icon.ok) throw new CoreFinanceApiError(icon.response.error, icon.response);
      patch.icon = icon.value;
    }
    if ("balance" in parsedBody.value) {
      const balance = readDecimalInput(parsedBody.value, "balance", true);
      if (!balance.ok) throw new CoreFinanceApiError(balance.response.error, balance.response);
      patch.balance = balance.value;
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

    return patch;
  };

  const requireFound = <T>(record: T | null, type: string, id: string): T => {
    if (!record) {
      throw new CoreFinanceApiError(`${type} '${id}' was not found.`, {
        code: "NOT_FOUND",
        status: 404,
      });
    }
    return record;
  };

  return {
    async listAccounts() {
      const accounts = await repository.listActive();
      return { accounts: accounts.map(toAccountResponse) };
    },
    async getAccount(id) {
      return toAccountResponse(requireFound(await repository.getById(id), "Account", id));
    },
    async createAccount(body) {
      return toAccountResponse(await repository.create(parseCreate(body)));
    },
    async updateAccount(id, body) {
      return toAccountResponse(requireFound(await repository.update(id, parseUpdate(body)), "Account", id));
    },
    async deleteAccount(id) {
      if (!await run(() => repository.softDelete(id))) {
        throw new CoreFinanceApiError(`Account '${id}' was not found.`, {
          code: "NOT_FOUND",
          status: 404,
        });
      }
      return { deleted: true };
    },
  };
};
