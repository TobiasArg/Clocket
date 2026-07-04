import type {
  AccountItem,
  AccountsRepository,
  CreateAccountInput,
  UpdateAccountPatch,
} from "@/domain/accounts/repository";
import {
  CoreFinanceHttpError,
  coreFinanceHttpClient,
  isNotFoundError,
  withCoreFinanceErrors,
} from "./coreFinanceHttpClient";
import { ensureCoreBackendCleanStartCutover } from "./coreFinanceCleanStart";

interface AccountResponse {
  id: string;
  name: string;
  balance: string;
  currency: "USD" | "ARS";
  icon: string;
  createdAt: string;
  updatedAt: string;
}

interface AccountListResponse {
  accounts: AccountResponse[];
}

interface DeleteResponse {
  deleted: true;
}

const parseBalance = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new CoreFinanceHttpError("Invalid account balance payload.", {
      code: "INVALID_PAYLOAD",
      status: 502,
    });
  }
  return parsed;
};

const toAccountItem = (account: AccountResponse): AccountItem => ({
  id: account.id,
  name: account.name,
  balance: parseBalance(account.balance),
  currency: account.currency,
  icon: account.icon,
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
});

export class HttpAccountsRepository implements AccountsRepository {
  public constructor() {
    ensureCoreBackendCleanStartCutover();
  }

  public async list(): Promise<AccountItem[]> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.get<AccountListResponse>("/api/accounts");
      return response.data.accounts.map(toAccountItem);
    });
  }

  public async getById(id: string): Promise<AccountItem | null> {
    try {
      return await withCoreFinanceErrors(async () => {
        const response = await coreFinanceHttpClient.get<AccountResponse>(`/api/accounts/${id}`);
        return toAccountItem(response.data);
      });
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async create(input: CreateAccountInput): Promise<AccountItem> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.post<AccountResponse>("/api/accounts", input);
      return toAccountItem(response.data);
    });
  }

  public async update(id: string, patch: UpdateAccountPatch): Promise<AccountItem | null> {
    try {
      return await withCoreFinanceErrors(async () => {
        const response = await coreFinanceHttpClient.patch<AccountResponse>(`/api/accounts/${id}`, patch);
        return toAccountItem(response.data);
      });
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async remove(id: string): Promise<boolean> {
    try {
      return await withCoreFinanceErrors(async () => {
        const response = await coreFinanceHttpClient.delete<DeleteResponse>(`/api/accounts/${id}`);
        return response.data.deleted === true;
      });
    } catch (error) {
      if (isNotFoundError(error)) return false;
      throw error;
    }
  }

  public async clearAll(): Promise<void> {
    const accounts = await this.list();
    await Promise.all(accounts.map((account) => this.remove(account.id)));
  }
}

export const httpAccountsRepository: AccountsRepository = new HttpAccountsRepository();
