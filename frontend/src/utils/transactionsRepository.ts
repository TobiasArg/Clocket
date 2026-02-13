import type { TransactionDetailed } from "@/types";

export interface TransactionItem extends TransactionDetailed {
  id: string;
}

export type CreateTransactionInput = Omit<TransactionItem, "id">;
export type UpdateTransactionPatch = Partial<CreateTransactionInput>;

export interface TransactionsRepository {
  list: () => Promise<TransactionItem[]>;
  getById: (id: string) => Promise<TransactionItem | null>;
  create: (input: CreateTransactionInput) => Promise<TransactionItem>;
  update: (id: string, patch: UpdateTransactionPatch) => Promise<TransactionItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
