import { useEffect, useMemo, useRef, useState } from "react";
import type { CuotaItem, GoalCardSimple, SpendingCategory, Transaction } from "@/types";
import {
  TRANSACTION_EXPENSE_TEXT_CLASS,
  TRANSACTION_INCOME_TEXT_CLASS,
} from "@/constants";
import { useAccounts } from "./useAccounts";
import { useCategories } from "./useCategories";
import { useCuotas } from "./useCuotas";
import { useGoals } from "./useGoals";
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
  dashboardGoals: GoalCardSimple[];
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

const FALLBACK_SPENDING_COLOR = "bg-[#71717A]";

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAmountColor = (amount: string, amountColor?: string): string => {
  const normalizedAmount = amount.trim();
  if (normalizedAmount.startsWith("+")) {
    return TRANSACTION_INCOME_TEXT_CLASS;
  }

  if (normalizedAmount.startsWith("-")) {
    return TRANSACTION_EXPENSE_TEXT_CLASS;
  }

  return amountColor ?? "text-[var(--text-primary)]";
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
  const { items: goalItems } = useGoals();
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

  const categoryInfoById = useMemo(() => {
    const map = new Map<string, { name: string; color: string; icon: string }>();
    categories.forEach((category) => {
      map.set(category.id, {
        name: category.name,
        color: category.iconBg || FALLBACK_SPENDING_COLOR,
        icon: category.icon || "tag",
      });
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

  const transactionFlowByAccountId = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; net: number }>();

    transactionItems.forEach((transaction) => {
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

  const overallTransactionFlow = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactionItems.forEach((transaction) => {
      const amount = parseSignedAmount(transaction.amount);
      if (amount > 0) {
        income += amount;
      } else if (amount < 0) {
        expense += Math.abs(amount);
      }
    });

    return {
      income,
      expense,
      net: income - expense,
    };
  }, [transactionItems]);

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
      .map((transaction) => {
        const categoryInfo = transaction.categoryId
          ? categoryInfoById.get(transaction.categoryId)
          : undefined;
        return {
          key: transaction.id,
          icon: categoryInfo?.icon ?? transaction.icon,
          iconBg: categoryInfo?.color ?? transaction.iconBg,
          name: transaction.name,
          date: RECENT_DATE_FORMATTER.format(
            getTransactionDateForMonthBalance(transaction) ?? new Date(),
          ),
          amount: transaction.amount,
          amountColor: getAmountColor(transaction.amount, transaction.amountColor),
        };
      });
  }, [transactionItems, transactions, categoryInfoById]);

  const savedAmountByGoalId = useMemo(() => {
    const map = new Map<string, number>();

    transactionItems.forEach((transaction) => {
      if (!transaction.goalId) {
        return;
      }

      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0) {
        return;
      }

      map.set(transaction.goalId, (map.get(transaction.goalId) ?? 0) + Math.abs(amount));
    });

    return map;
  }, [transactionItems]);

  const dashboardGoals = useMemo<GoalCardSimple[]>(() => {
    return goalItems
      .map((goal) => {
        const savedAmount = savedAmountByGoalId.get(goal.id) ?? 0;
        const progressPercent = goal.targetAmount > 0
          ? Math.max(0, Math.min(100, Math.round((savedAmount / goal.targetAmount) * 100)))
          : 0;

        return {
          id: goal.id,
          icon: goal.icon,
          name: goal.title,
          progressPercent,
          colorKey: goal.colorKey,
        };
      })
      .sort((left, right) => right.progressPercent - left.progressPercent)
      .slice(0, 8);
  }, [goalItems, savedAmountByGoalId]);

  const computedSpendingCategories = useMemo<SpendingCategory[]>(() => {
    const monthWindow = getCurrentMonthWindow();
    const grouped = new Map<string, { label: string; amount: number; color: string }>();

    transactionItems.forEach((transaction) => {
      if (transaction.transactionType === "saving" || transaction.goalId) {
        return;
      }

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

      const parentCategoryId = transaction.categoryId?.trim() || "uncategorized";
      const categoryInfo = transaction.categoryId
        ? categoryInfoById.get(transaction.categoryId)
        : null;
      const categoryLabel = categoryInfo?.name || transaction.category || "Uncategorized";
      const categoryColor = categoryInfo?.color || FALLBACK_SPENDING_COLOR;
      const current = grouped.get(parentCategoryId);

      if (!current) {
        grouped.set(parentCategoryId, {
          label: categoryLabel,
          amount: Math.abs(signedAmount),
          color: categoryColor,
        });
        return;
      }

      current.amount += Math.abs(signedAmount);
    });

    const total = Array.from(grouped.values()).reduce((sum, value) => sum + value.amount, 0);
    if (total <= 0) {
      return [];
    }

    return Array.from(grouped.values())
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 4)
      .map((item) => ({
        label: item.label,
        percentage: Math.max(1, Math.round((item.amount / total) * 100)),
        color: item.color,
      }));
  }, [categoryInfoById, transactionItems]);

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

  const displayedTotalBalance = totalBalance ?? formatCurrency(overallTransactionFlow.net);
  const displayedIncomeValue = incomeValue ?? formatCurrency(overallTransactionFlow.income);
  const displayedExpenseValue = expenseValue ?? formatCurrency(overallTransactionFlow.expense);
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
      const accountFlow = transactionFlowByAccountId.get(account.id);
      slides.push({
        id: account.id,
        label: account.name,
        balance: formatCurrency(accountFlow?.net ?? 0),
        incomeValue: formatCurrency(accountFlow?.income ?? 0),
        expenseValue: formatCurrency(accountFlow?.expense ?? 0),
      });
    });

    return slides;
  }, [
    accounts,
    displayedExpenseValue,
    displayedIncomeValue,
    displayedTotalBalance,
    transactionFlowByAccountId,
  ]);

  const [activeBalanceSlide, setActiveBalanceSlide] = useState<number>(activeDot);
  const maxBalanceSlideIndexRef = useRef<number>(Math.max(0, balanceSlides.length - 1));

  useEffect(() => {
    maxBalanceSlideIndexRef.current = Math.max(0, balanceSlides.length - 1);
  }, [balanceSlides.length]);

  useEffect(() => {
    setActiveBalanceSlide((current) => {
      const maxIndex = maxBalanceSlideIndexRef.current;
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
    const maxIndex = maxBalanceSlideIndexRef.current;
    setActiveBalanceSlide(Math.max(0, Math.min(activeDot, maxIndex)));
  }, [activeDot]);

  return {
    activeBalanceSlide,
    balanceSlides,
    dashboardGoals,
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
