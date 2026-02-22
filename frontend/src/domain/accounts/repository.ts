import type { Account } from "@/types";

export const DEFAULT_ACCOUNT_ID = "account_default";
export const DEFAULT_ACCOUNT_NAME = "Cuenta principal";
export const DEFAULT_ACCOUNT_ICON = "wallet";
export const ACCOUNT_ICON_OPTIONS: string[] = [
  "money",
  "currency-dollar",
  "wallet",
  "credit-card",
  "bank",
  "buildings",
  "building-office",
  "dots-three",
];

export type AccountItem = Account;

export interface CreateAccountInput {
  name: string;
  balance: number;
  icon: string;
}

export interface UpdateAccountPatch {
  name?: string;
  balance?: number;
  icon?: string;
}

export interface AccountsRepository {
  list: () => Promise<AccountItem[]>;
  getById: (id: string) => Promise<AccountItem | null>;
  create: (input: CreateAccountInput) => Promise<AccountItem>;
  update: (id: string, patch: UpdateAccountPatch) => Promise<AccountItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
