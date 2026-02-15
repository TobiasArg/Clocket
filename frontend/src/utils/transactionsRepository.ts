import type { TransactionDetailed, TransactionType } from "@/types";

export interface TransactionItem extends TransactionDetailed {
  id: string;
  accountId: string;
  transactionType: TransactionType;
  goalId?: string;
  categoryId?: string;
  subcategoryName?: string;
  cuotaPlanId?: string;
  cuotaInstallmentIndex?: number;
  cuotaInstallmentsCount?: number;
  date: string;
  createdAt?: string;
}

export type CreateTransactionInput = Omit<TransactionItem, "id" | "transactionType"> & {
  transactionType?: TransactionType;
};
export type UpdateTransactionPatch = Partial<CreateTransactionInput>;

export interface TransactionsRepository {
  list: () => Promise<TransactionItem[]>;
  getById: (id: string) => Promise<TransactionItem | null>;
  create: (input: CreateTransactionInput) => Promise<TransactionItem>;
  update: (id: string, patch: UpdateTransactionPatch) => Promise<TransactionItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
