import type { StatisticsFlowDay } from "@/types";
import type { TransactionItem } from "./transactionsRepository";
import { getTransactionDateForMonthBalance } from "./monthlyBalance";

const FLOW_EXPENSE_COLORS = [
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#2563EB",
  "#7C3AED",
  "#0891B2",
  "#52525B",
] as const;

const FLOW_INCOME_COLOR = "#16A34A";

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildWeekdayLabel = (date: Date): string => (
  new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", "").toUpperCase()
);

const buildDateLabel = (date: Date): string => (
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(date).replace(".", "")
);

const sortByAmountDesc = (entries: [string, number][]): [string, number][] => (
  entries.sort((left, right) => right[1] - left[1])
);

interface BuildStatisticsDailyFlowOptions {
  categoryNameById: Map<string, string>;
  now?: Date;
  transactions: TransactionItem[];
}

export const buildStatisticsDailyFlow = ({
  categoryNameById,
  now = new Date(),
  transactions,
}: BuildStatisticsDailyFlowOptions): StatisticsFlowDay[] => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  const dayBuckets = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      dateKey: buildDateKey(date),
      expenseMap: new Map<string, number>(),
      expenseTotal: 0,
      incomeMap: new Map<string, number>(),
      incomeTotal: 0,
    };
  });

  const dayByKey = new Map(dayBuckets.map((bucket) => [bucket.dateKey, bucket]));
  const rangeStart = dayBuckets[0]?.date;
  const rangeEnd = new Date(dayBuckets[dayBuckets.length - 1]?.date ?? now);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  transactions.forEach((transaction) => {
    const transactionDate = getTransactionDateForMonthBalance(transaction);
    if (!transactionDate || !rangeStart || transactionDate < rangeStart || transactionDate >= rangeEnd) {
      return;
    }

    const day = dayByKey.get(buildDateKey(transactionDate));
    if (!day) {
      return;
    }

    const amount = parseSignedAmount(transaction.amount);
    if (amount === 0) {
      return;
    }

    const category = transaction.categoryId
      ? (categoryNameById.get(transaction.categoryId) ?? "Uncategorized")
      : (transaction.category || (amount > 0 ? "Ingreso" : "Uncategorized"));

    if (amount > 0) {
      day.incomeMap.set(category, (day.incomeMap.get(category) ?? 0) + amount);
      day.incomeTotal += amount;
      return;
    }

    const expenseAmount = Math.abs(amount);
    day.expenseMap.set(category, (day.expenseMap.get(category) ?? 0) + expenseAmount);
    day.expenseTotal += expenseAmount;
  });

  const expenseTotalsByCategory = new Map<string, number>();
  dayBuckets.forEach((day) => {
    day.expenseMap.forEach((amount, category) => {
      expenseTotalsByCategory.set(category, (expenseTotalsByCategory.get(category) ?? 0) + amount);
    });
  });

  const expenseColorByCategory = new Map<string, string>();
  sortByAmountDesc(Array.from(expenseTotalsByCategory.entries()))
    .forEach(([category], index) => {
      expenseColorByCategory.set(category, FLOW_EXPENSE_COLORS[index % FLOW_EXPENSE_COLORS.length]);
    });

  return dayBuckets.map((day) => ({
    dateKey: day.dateKey,
    dateLabel: buildDateLabel(day.date),
    expenseByCategory: sortByAmountDesc(Array.from(day.expenseMap.entries()))
      .map(([category, amount]) => ({
        amount,
        category,
        color: expenseColorByCategory.get(category) ?? FLOW_EXPENSE_COLORS[0],
      })),
    expenseTotal: day.expenseTotal,
    incomeByCategory: sortByAmountDesc(Array.from(day.incomeMap.entries()))
      .map(([category, amount]) => ({
        amount,
        category,
        color: FLOW_INCOME_COLOR,
      })),
    incomeTotal: day.incomeTotal,
    label: buildWeekdayLabel(day.date),
  }));
};
