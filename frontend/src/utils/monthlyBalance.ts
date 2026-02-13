import type { TransactionItem } from "@/utils";

export interface MonthWindow {
  start: Date;
  end: Date;
}

export interface MonthlyBalance {
  income: number;
  expense: number;
  net: number;
}

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseLegacyDateFromMeta = (meta: string): Date | null => {
  const isoDate = meta.split(" • ")[0]?.trim();
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }

  const parsed = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getCurrentMonthWindow = (now: Date = new Date()): MonthWindow => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
};

export const getTransactionDateForMonthBalance = (
  transaction: TransactionItem,
): Date | null => {
  // Rule: prefer `date` when present, otherwise `createdAt`.
  // Legacy fallback: older records may only have an ISO date prefix in `meta`.
  const source = transaction.date ?? transaction.createdAt;
  if (source) {
    const parsed = new Date(source);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return parseLegacyDateFromMeta(transaction.meta);
};

export const getMonthlyBalance = (
  transactions: TransactionItem[],
  now: Date = new Date(),
): MonthlyBalance => {
  const { start, end } = getCurrentMonthWindow(now);

  let income = 0;
  let expense = 0;

  transactions.forEach((transaction) => {
    const transactionDate = getTransactionDateForMonthBalance(transaction);
    if (!transactionDate) {
      return;
    }

    if (transactionDate < start || transactionDate >= end) {
      return;
    }

    const amount = parseSignedAmount(transaction.amount);
    if (amount > 0) {
      income += amount;
      return;
    }

    if (amount < 0) {
      expense += Math.abs(amount);
    }
  });

  return {
    income,
    expense,
    net: income - expense,
  };
};
