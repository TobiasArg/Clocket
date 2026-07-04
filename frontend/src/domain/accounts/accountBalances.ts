import { convertCurrencyAmount, type TransactionInputCurrency } from "@/domain/currency/transactionCurrency";

export interface AccountBalanceSource {
  id: string;
  balance: number;
  currency?: TransactionInputCurrency;
}

export interface AccountFlowSource {
  accountId: string;
  amount: string;
  goalId?: string;
  transactionType?: string;
}

export interface AccountFlowSummary {
  expense: number;
  income: number;
}

export const parseSignedMoneyValue = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildAccountFlowsById = <T extends AccountFlowSource>(
  transactions: T[],
): Map<string, AccountFlowSummary> => {
  const map = new Map<string, AccountFlowSummary>();

  transactions.forEach((transaction) => {
    if (transaction.transactionType === "saving" || transaction.goalId) {
      return;
    }

    const amount = parseSignedMoneyValue(transaction.amount);
    const current = map.get(transaction.accountId) ?? { income: 0, expense: 0 };

    if (amount > 0) {
      current.income += amount;
    } else if (amount < 0) {
      current.expense += Math.abs(amount);
    }

    map.set(transaction.accountId, current);
  });

  return map;
};

export const getDisplayedOpeningBalance = (
  account: AccountBalanceSource,
  displayCurrency: TransactionInputCurrency,
  usdArsRate: number,
): number => convertCurrencyAmount(
  account.balance,
  account.currency ?? displayCurrency,
  displayCurrency,
  usdArsRate,
);

export const getDisplayedAccountBalance = (
  account: AccountBalanceSource,
  flow: AccountFlowSummary | undefined,
  displayCurrency: TransactionInputCurrency,
  usdArsRate: number,
): number => getDisplayedOpeningBalance(account, displayCurrency, usdArsRate)
  + ((flow?.income ?? 0) - (flow?.expense ?? 0));
