import { useEffect, useMemo, useState } from "react";
import type { CuotaItem, SpendingCategory, Transaction } from "@/types";
import { useAccounts } from "./useAccounts";
import { useCategories } from "./useCategories";
import { useCuotas } from "./useCuotas";
import { useTransactions } from "./useTransactions";
import {
  formatCurrency,
  getCurrentMonthWindow,
  getMonthlyBalance,
  getPendingInstallmentsTotalForMonth,
  getTransactionDateForMonthBalance,
  isCuotaActiveInMonth,
} from "@/utils";

export interface HomeTransactionRow {
  key: string;
  icon: string;
  iconBg: string;
  name: string;
  date: string;
  amount: string;
  amountColor?: string;
}

export interface HomeBalanceSlide {
  id: string;
  label: string;
  balance: string;
  incomeValue?: string;
  expenseValue?: string;
}

export interface UseHomePageModelOptions {
  activeDot?: number;
  transactions?: Transaction[];
  spendingTotal?: string;
  spendingCategories?: SpendingCategory[];
  totalBalance?: string;
  incomeValue?: string;
  expenseValue?: string;
  cuotas?: CuotaItem[];
  loadingLabel?: string;
}

export interface UseHomePageModelResult {
  activeBalanceSlide: number;
  balanceSlides: HomeBalanceSlide[];
  displayedExpenseValue: string;
  displayedIncomeValue: string;
  displayedSpendingCategories: SpendingCategory[];
  displayedSpendingTotal: string;
  displayedTotalBalance: string;
  hasCuotasError: boolean;
  hasTransactionsError: boolean;
  isCuotasLoading: boolean;
  isTransactionsLoading: boolean;
  pendingInstallmentsLabel: string;
  recentTransactions: HomeTransactionRow[];
  setActiveBalanceSlide: (nextSlide: number) => void;
  visibleCuotas: CuotaItem[];
}

const RECENT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const SPENDING_COLORS = [
  "bg-[#DC2626]",
  "bg-[#2563EB]",
  "bg-[#7C3AED]",
  "bg-[#71717A]",
] as const;

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAmountColor = (amount: string, amountColor?: string): string => {
  const normalizedAmount = amount.trim();
  if (normalizedAmount.startsWith("+")) {
    return "text-[#16A34A]";
  }

  if (normalizedAmount.startsWith("-")) {
    return "text-[#DC2626]";
  }

  return amountColor ?? "text-black";
};

export const useHomePageModel = (
  options: UseHomePageModelOptions = {},
): UseHomePageModelResult => {
  const {
    activeDot = 0,
    transactions,
    spendingTotal,
    spendingCategories,
    totalBalance,
    incomeValue,
    expenseValue,
    cuotas,
    loadingLabel = "Loading...",
  } = options;

  const { items: accounts } = useAccounts();
  const {
    items: transactionItems,
    isLoading: isTransactionsLoading,
    error: transactionsError,
  } = useTransactions();
  const { items: categories } = useCategories();
  const {
    items: cuotaItems,
    isLoading: isCuotasLoading,
    error: cuotasError,
  } = useCuotas();

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });

    return map;
  }, [categories]);

  const monthlyBalance = useMemo(
    () => getMonthlyBalance(transactionItems),
    [transactionItems],
  );
  const monthlyPendingInstallments = useMemo(
    () => getPendingInstallmentsTotalForMonth(cuotaItems),
    [cuotaItems],
  );

  const monthlyBalanceByAccountId = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; net: number }>();
    const monthWindow = getCurrentMonthWindow();

    transactionItems.forEach((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return;
      }

      if (
        transactionDate < monthWindow.start ||
        transactionDate >= monthWindow.end
      ) {
        return;
      }

      const amount = parseSignedAmount(transaction.amount);
      const current = map.get(transaction.accountId) ?? {
        income: 0,
        expense: 0,
        net: 0,
      };

      if (amount > 0) {
        current.income += amount;
      } else if (amount < 0) {
        current.expense += Math.abs(amount);
      }

      current.net = current.income - current.expense;
      map.set(transaction.accountId, current);
    });

    return map;
  }, [transactionItems]);

  const totalAccountsBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );

  const recentTransactions = useMemo<HomeTransactionRow[]>(() => {
    if (transactions) {
      return transactions.map((transaction, index) => ({
        key: `${transaction.name}-${index}`,
        icon: transaction.icon,
        iconBg: transaction.iconBg,
        name: transaction.name,
        date: transaction.date,
        amount: transaction.amount,
        amountColor: getAmountColor(transaction.amount, transaction.amountColor),
      }));
    }

    return [...transactionItems]
      .sort((left, right) => {
        const leftDate = getTransactionDateForMonthBalance(left)?.getTime() ?? 0;
        const rightDate = getTransactionDateForMonthBalance(right)?.getTime() ?? 0;
        return rightDate - leftDate;
      })
      .slice(0, 3)
      .map((transaction) => ({
        key: transaction.id,
        icon: transaction.icon,
        iconBg: transaction.iconBg,
        name: transaction.name,
        date: RECENT_DATE_FORMATTER.format(
          getTransactionDateForMonthBalance(transaction) ?? new Date(),
        ),
        amount: transaction.amount,
        amountColor: getAmountColor(transaction.amount, transaction.amountColor),
      }));
  }, [transactionItems, transactions]);

  const computedSpendingCategories = useMemo<SpendingCategory[]>(() => {
    const monthWindow = getCurrentMonthWindow();
    const grouped = new Map<string, number>();

    transactionItems.forEach((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return;
      }

      if (
        transactionDate < monthWindow.start ||
        transactionDate >= monthWindow.end
      ) {
        return;
      }

      const signedAmount = parseSignedAmount(transaction.amount);
      if (signedAmount >= 0) {
        return;
      }

      const categoryLabel = transaction.categoryId
        ? (categoryNameById.get(transaction.categoryId) ?? "Uncategorized")
        : (transaction.category || "Uncategorized");

      grouped.set(categoryLabel, (grouped.get(categoryLabel) ?? 0) + Math.abs(signedAmount));
    });

    const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return [];
    }

    return Array.from(grouped.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, amount], index) => ({
        label,
        percentage: Math.max(1, Math.round((amount / total) * 100)),
        color: SPENDING_COLORS[index % SPENDING_COLORS.length],
      }));
  }, [categoryNameById, transactionItems]);

  const visibleCuotas = useMemo(() => {
    if (cuotas) {
      return cuotas;
    }

    return cuotaItems
      .filter((cuota) => isCuotaActiveInMonth(cuota))
      .slice(0, 3)
      .map<CuotaItem>((cuota) => ({
        name: cuota.title,
        progressLabel: `${cuota.paidInstallmentsCount}/${cuota.installmentsCount} cuotas`,
        amount: formatCurrency(cuota.installmentAmount),
      }));
  }, [cuotaItems, cuotas]);

  const displayedTotalBalance = totalBalance ?? formatCurrency(totalAccountsBalance);
  const displayedIncomeValue = incomeValue ?? formatCurrency(monthlyBalance.income);
  const displayedExpenseValue = expenseValue ?? formatCurrency(monthlyBalance.expense);
  const displayedSpendingTotal = spendingTotal ?? formatCurrency(monthlyBalance.expense);
  const displayedSpendingCategories = spendingCategories ?? computedSpendingCategories;
  const pendingInstallmentsLabel = isCuotasLoading && !cuotas && cuotaItems.length === 0
    ? loadingLabel
    : formatCurrency(monthlyPendingInstallments);

  const balanceSlides = useMemo<HomeBalanceSlide[]>(() => {
    const slides: HomeBalanceSlide[] = [
      {
        id: "total-balance",
        label: "TOTAL BALANCE",
        balance: displayedTotalBalance,
        incomeValue: displayedIncomeValue,
        expenseValue: displayedExpenseValue,
      },
    ];

    accounts.forEach((account) => {
      const accountBalance = monthlyBalanceByAccountId.get(account.id);
      slides.push({
        id: account.id,
        label: account.name,
        balance: formatCurrency(account.balance),
        incomeValue: formatCurrency(accountBalance?.income ?? 0),
        expenseValue: formatCurrency(accountBalance?.expense ?? 0),
      });
    });

    return slides;
  }, [
    accounts,
    displayedExpenseValue,
    displayedIncomeValue,
    displayedTotalBalance,
    monthlyBalanceByAccountId,
  ]);

  const [activeBalanceSlide, setActiveBalanceSlide] = useState<number>(activeDot);

  useEffect(() => {
    setActiveBalanceSlide((current) => {
      const maxIndex = Math.max(0, balanceSlides.length - 1);
      if (current > maxIndex) {
        return maxIndex;
      }

      if (current < 0) {
        return 0;
      }

      return current;
    });
  }, [balanceSlides.length]);

  useEffect(() => {
    const maxIndex = Math.max(0, balanceSlides.length - 1);
    setActiveBalanceSlide(Math.max(0, Math.min(activeDot, maxIndex)));
  }, [activeDot, balanceSlides.length]);

  return {
    activeBalanceSlide,
    balanceSlides,
    displayedExpenseValue,
    displayedIncomeValue,
    displayedSpendingCategories,
    displayedSpendingTotal,
    displayedTotalBalance,
    hasCuotasError: Boolean(cuotasError),
    hasTransactionsError: Boolean(transactionsError),
    isCuotasLoading,
    isTransactionsLoading,
    pendingInstallmentsLabel,
    recentTransactions,
    setActiveBalanceSlide,
    visibleCuotas,
  };
};
