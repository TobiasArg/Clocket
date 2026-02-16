import type { Account } from "@/types";

export const DEFAULT_ACCOUNT_ID = "account_default";
export const DEFAULT_ACCOUNT_NAME = "Cuenta principal";

export type AccountItem = Account;

export interface CreateAccountInput {
  name: string;
  balance: number;
}

export interface UpdateAccountPatch {
  name?: string;
  balance?: number;
}

export interface AccountsRepository {
  list: () => Promise<AccountItem[]>;
  getById: (id: string) => Promise<AccountItem | null>;
  create: (input: CreateAccountInput) => Promise<AccountItem>;
  update: (id: string, patch: UpdateAccountPatch) => Promise<AccountItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
