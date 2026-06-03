import type { CurrencyCode } from "../../generated/prisma/client";
import type { AccountRecord, CreateAccountInput, UpdateAccountInput } from "./accountsRepository";

export interface AccountResponse {
  id: string;
  name: string;
  balance: string;
  currency: CurrencyCode;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountListResponse {
  accounts: AccountResponse[];
}

export interface DeleteAccountResponse {
  deleted: true;
}

export type CreateAccountRequest = CreateAccountInput;
export type UpdateAccountRequest = UpdateAccountInput;

export const toAccountResponse = (account: AccountRecord): AccountResponse => ({
  id: account.id,
  name: account.name,
  balance: account.balance,
  currency: account.currency,
  icon: account.icon,
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
});
