import type { TransactionRecord } from "./transactionsRepository";

export type TransactionResponse = Omit<TransactionRecord, "deletedAt">;

export interface TransactionListResponse {
  transactions: TransactionResponse[];
}

export interface DeleteTransactionResponse {
  deleted: true;
}

export const toTransactionResponse = (transaction: TransactionRecord): TransactionResponse => ({
  id: transaction.id,
  accountId: transaction.accountId,
  categoryId: transaction.categoryId,
  subcategoryId: transaction.subcategoryId,
  goalId: transaction.goalId,
  installmentPlanId: transaction.installmentPlanId,
  transactionType: transaction.transactionType,
  classification: transaction.classification ?? (Number(transaction.amount) > 0 ? "income" : transaction.transactionType === "saving" ? "saving" : "expense"),
  name: transaction.name,
  amount: transaction.amount,
  currency: transaction.currency,
  date: transaction.date,
  notes: transaction.notes,
  uiIcon: transaction.uiIcon,
  uiIconBg: transaction.uiIconBg,
  categoryName: transaction.categoryName ?? null,
  subcategoryName: transaction.subcategoryName ?? null,
  cuotaInstallmentIndex: transaction.cuotaInstallmentIndex,
  cuotaInstallmentsCount: transaction.cuotaInstallmentsCount,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});
